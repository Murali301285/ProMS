
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { MASTER_CONFIG } from '@/lib/masterConfig';

export async function POST(req) {
    let body = null;
    // console.log("🔥🔥🔥 CRUD API HIT - NEW CODE LOADED 🔥🔥🔥");
    try {
        body = await req.json();
        const { table, action, data, id } = body;
        // console.log("ACTION:", action, "TABLE:", table);

        if (!table) return NextResponse.json({ message: 'Table required' }, { status: 400 });

        // Whitelist tables
        const validTables = [
            'TblDbConfig', 'TblModule', 'TblPage', 'TblAuditLog', 'TblSubGroup',
            'TblCompany', 'TblActivity', 'TblDepthSlab', 'TblDestination',
            'TblDestinationMaterialMapping', 'TblEntryType', 'TblEquipmentGroup',
            'TblEquipment', 'TblLocation', 'TblMaterial', 'TblMethod',
            'TblOperator', 'TblPatch', 'TblPlant', 'TblQtyTripMapping',
            'TblRelay', 'TblScale', 'TblSector', 'TblShift',
            'TblShiftIncharge', 'TblSMESupplier', 'TblSource',
            'TblStoppageReason', 'TblStrata', 'TblUnit',
            'TblSMECategory', 'TblDrillingRemarks', 'TblEquipmentOwnerType',
            'TblOperatorCategory', 'TblOperatorSubCategory', 'TblStoppageReason', 'TblStoppageCategory',
            'tblParty', 'TblBDSEntry', 'TblRole_New', 'TblUser_New', 'TblDrillingAgency'
        ];
        if (!validTables.includes(table)) return NextResponse.json({ message: 'Invalid table' }, { status: 403 });

        const tableName = `[Master].[${table}]`;

        if (action === 'read') {
            // Check for PMSCode Format
            let pmsFormat = null;
            try {
                const formatRes = await executeQuery(`
                    SELECT * FROM [Master].[PMSCodeFormat] 
                    WHERE TableName = @table AND FieldName = 'PMSCode'
                `, [{ name: 'table', type: 'VarChar', value: tableName }]);
                if (formatRes.length > 0) {
                    pmsFormat = formatRes[0];
                }
            } catch (ignore) { }

            let query = `SELECT *`;

            // Add Computed Column for PMSCode if rule exists
            if (pmsFormat) {
                const { Prefix, NoOfDigit } = pmsFormat;
                // Formula: Prefix + RIGHT('0000000' + CAST(SlNo AS VARCHAR), NoOfDigit - LEN(Prefix))
                // Note: REPLICATE('0', 20) ensures enough zeros.
                const padLen = NoOfDigit - Prefix.length;
                if (padLen > 0) {
                    query += `, CONCAT('${Prefix}', RIGHT(REPLICATE('0', ${padLen}) + CAST(SlNo AS VARCHAR(20)), ${padLen})) AS PMSCode`;
                } else {
                    query += `, CONCAT('${Prefix}', SlNo) AS PMSCode`;
                }
            }

            query += ` FROM ${tableName}`;
            const queryParams = [];

            if (table === 'TblAuditLog') {
                const { filters } = body;
                if (filters && filters.fromDate && filters.toDate) {
                    query += ` WHERE ActionDate BETWEEN @fromDate AND @toDate`;
                    queryParams.push({ name: 'fromDate', type: 'VarChar', value: filters.fromDate });
                    queryParams.push({ name: 'toDate', type: 'VarChar', value: filters.toDate + ' 23:59:59' });
                }
                query += ` ORDER BY ActionDate DESC`;
            } else if (table === 'TblQtyTripMapping') {
                // Specific Join for Qty Trip Mapping
                // Note: TblQtyTripMapping does not have UnitId.
                query = `
                    SELECT 
                        T.*,
                        EG.Name AS EquipmentGroupName,
                        M.MaterialName
                    FROM [Master].[TblQtyTripMapping] T
                    LEFT JOIN [Master].[TblEquipmentGroup] EG ON T.EquipmentGroupId = EG.SlNo
                    LEFT JOIN [Master].[TblMaterial] M ON T.MaterialId = M.SlNo
                    WHERE T.IsDelete = 0 
                    ORDER BY T.SlNo ASC
                `;
            } else {
                query += ` WHERE IsDelete = 0 ORDER BY SlNo ASC`;
            }
            const result = await executeQuery(query, queryParams);
            return NextResponse.json(result);
        }

        if (action === 'create') {
            // Uniqueness Check for Material Master
            // GENERIC UNIQUENESS & RESTORE LOGIC
            // Find config for this table
            const configKey = Object.keys(MASTER_CONFIG).find(key =>
                MASTER_CONFIG[key].table === `[Master].[${table}]` || MASTER_CONFIG[key].table === `[Master].[${table}]`.replace('[Master].[', '').replace(']', '')
            );

            if (configKey) {
                const config = MASTER_CONFIG[configKey];
                for (const col of config.columns) {
                    // Check if column is unique and present in data
                    const isObj = typeof col === 'object';
                    const colName = isObj ? col.accessor : col;
                    const isUnique = isObj && col.unique;

                    if (isUnique && data[colName]) {
                        const trimmedVal = data[colName].toString().trim();

                        // Case-insensitive check
                        const existing = await executeQuery(`
                            SELECT Top 1 SlNo, IsDelete FROM ${tableName} 
                            WHERE LOWER(LTRIM(RTRIM(${colName}))) = LOWER(@val)
                        `, [{ name: 'val', type: 'NVarChar', value: trimmedVal }]);

                        if (existing.length > 0) {
                            const record = existing[0];
                            if (!record.IsDelete) {
                                return NextResponse.json({
                                    error: `${isObj && col.label ? col.label : colName} is already there`,
                                    existingId: record.SlNo // Return ID for Upsert logic
                                }, { status: 409 });
                            } else {
                                // RESTORE LOGIC
                                // Exclude IsActive from dynamic keys to avoid duplicate set
                                const auditCols = ['createdby', 'createddate', 'updatedby', 'updateddate', 'isdelete', 'isactive'];
                                const keys = Object.keys(data).filter(k =>
                                    k !== 'SlNo' && !auditCols.includes(k.toLowerCase())
                                );

                                const setClause = keys.map(k => `[${k}] = @${k}`).join(', ') + ', [IsDelete] = 0, [IsActive] = 1, [UpdatedBy] = 2, [UpdatedDate] = GETDATE()';

                                const inputs = keys.map(k => {
                                    let type = 'NVarChar';
                                    let value = data[k];

                                    // Handle empty strings
                                    if (value === '') value = null;

                                    if (typeof value === 'number') {
                                        if (Number.isInteger(value)) type = 'Int';
                                        else type = 'Decimal';
                                    }
                                    if (typeof value === 'boolean') type = 'Bit';

                                    return { name: k, type, value };
                                });
                                inputs.push({ name: 'id', type: 'Int', value: record.SlNo });

                                await executeQuery(`UPDATE ${tableName} SET ${setClause} WHERE SlNo = @id`, inputs);

                                // Audit Log for Restore
                                await executeQuery(`
                                    INSERT INTO [Master].[TblAuditLog] (Action, TableName, RecordId, NewValue, ActionBy)
                                    VALUES ('RESTORE_UPDATE', @table, @id, @val, 'Admin')
                                `, [
                                    { name: 'table', type: 'VarChar', value: table },
                                    { name: 'id', type: 'Int', value: record.SlNo },
                                    { name: 'val', type: 'NVarChar', value: JSON.stringify(data) }
                                ]);

                                return NextResponse.json({ success: true, message: 'Record restored and updated' });
                            }
                        }
                    }
                }

                // Composite Uniqueness Check
                if (config.uniqueConstraint && Array.isArray(config.uniqueConstraint)) {
                    const constraintCols = config.uniqueConstraint;
                    const whereConditions = constraintCols.map(col => `${col} = @${col}`).join(' AND ');
                    const inputs = constraintCols.map(col => {
                        let type = 'NVarChar';
                        let value = data[col];
                        if (typeof value === 'number') type = 'Int';
                        if (typeof value === 'boolean') type = 'Bit';
                        return { name: col, type, value };
                    });

                    const existing = await executeQuery(`
                        SELECT Top 1 SlNo, IsDelete FROM ${tableName}
                        WHERE ${whereConditions}
                    `, inputs);

                    if (existing.length > 0 && !existing[0].IsDelete) {
                        const colLabels = constraintCols.map(col => {
                            const colConfig = config.columns.find(c => typeof c === 'object' && c.accessor === col);
                            return colConfig?.label || col;
                        }).join(' + ');
                        return NextResponse.json({
                            error: `${colLabels} combination already exists. Please use the data table to search and modify if needed.`
                        }, { status: 409 });
                    }
                }
            }

            // Filter out any audit columns from the incoming data to prevent duplication
            const keys = Object.keys(data).filter(k => !['CreatedBy', 'CreatedDate', 'UpdatedBy', 'UpdatedDate', 'IsDelete'].includes(k));

            // Add Audit Columns
            const userId = 2; // Default to 'admin'
            keys.push('CreatedBy', 'CreatedDate', 'UpdatedBy', 'UpdatedDate', 'IsDelete');

            const cols = '[' + keys.join('], [') + ']';
            const vars = keys.map(k => k.includes('Date') ? 'GETDATE()' : `@${k}`).join(', ');

            // Construct inputs
            const inputs = keys.filter(k => !k.includes('Date')).map(k => {
                if (k === 'CreatedBy' || k === 'UpdatedBy') return { name: k, type: 'Int', value: userId };
                if (k === 'IsDelete') return { name: k, type: 'Bit', value: 0 };

                let type = 'NVarChar';
                let value = data[k];

                // Handle empty strings for potentially numeric columns (or all columns where empty usually means null)
                if (value === '') value = null;

                if (typeof value === 'number') {
                    // Primitive check, better to hint from metadata but we lack it here.
                    // If float, 'Int' type might round it? tedious 'Int' is 4-byte integer.
                    // 'Numeric' or 'Decimal' is safer for general numbers?
                    // Let's rely on NVarChar for auto-conversion if string, but if number, use Int?
                    // Problem: DrillingOutput is Decimal(18,2). Sending 'Int' might truncate?
                    // Tedious Int is integer.
                    // Better to send everything as NVarChar (except explicitly Int fields) and let SQL cast?
                    // Or detect float.
                    if (Number.isInteger(value)) type = 'Int';
                    else type = 'Decimal';
                }
                if (typeof value === 'boolean') type = 'Bit';

                return { name: k, type, value };
            });

            const query = `INSERT INTO ${tableName} (${cols}) OUTPUT INSERTED.SlNo VALUES (${vars})`;
            const result = await executeQuery(query, inputs);
            const newId = result[0]?.SlNo;

            // Audit Log
            await executeQuery(`
                INSERT INTO [Master].[TblAuditLog] (Action, TableName, NewValue, ActionBy)
                VALUES ('INSERT', @table, @val, 'Admin')
            `, [
                { name: 'table', type: 'VarChar', value: table },
                { name: 'val', type: 'NVarChar', value: JSON.stringify(data) }
            ]);

            return NextResponse.json({ success: true, id: newId });
        }

        if (action === 'update') {
            if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

            // GENERIC UNIQUENESS CHECK (UPDATE)
            const configKey = Object.keys(MASTER_CONFIG).find(key =>
                MASTER_CONFIG[key].table === `[Master].[${table}]` || MASTER_CONFIG[key].table === `[Master].[${table}]`.replace('[Master].[', '').replace(']', '')
            );

            if (configKey) {
                const config = MASTER_CONFIG[configKey];
                for (const col of config.columns) {
                    const isObj = typeof col === 'object';
                    const colName = isObj ? col.accessor : col;
                    const isUnique = isObj && col.unique;

                    if (isUnique && data[colName]) {
                        const trimmedVal = data[colName].toString().trim();

                        const existing = await executeQuery(`
                            SELECT Top 1 SlNo, IsDelete FROM ${tableName} 
                            WHERE LOWER(LTRIM(RTRIM(${colName}))) = LOWER(@val) AND SlNo != @id
                        `, [
                            { name: 'val', type: 'NVarChar', value: trimmedVal },
                            { name: 'id', type: 'Int', value: id }
                        ]);

                        if (existing.length > 0) {
                            return NextResponse.json({ error: `${isObj && col.label ? col.label : colName} is already there` }, { status: 409 });
                        }
                    }
                }

                // Composite Uniqueness Check (UPDATE)
                if (config.uniqueConstraint && Array.isArray(config.uniqueConstraint)) {
                    const constraintCols = config.uniqueConstraint;
                    const whereConditions = constraintCols.map(col => `${col} = @${col}`).join(' AND ');
                    const inputs = constraintCols.map(col => {
                        let type = 'NVarChar';
                        let value = data[col];
                        if (typeof value === 'number') type = 'Int';
                        if (typeof value === 'boolean') type = 'Bit';
                        return { name: col, type, value };
                    });
                    inputs.push({ name: 'id', type: 'Int', value: id });

                    const existing = await executeQuery(`
                        SELECT Top 1 SlNo, IsDelete FROM ${tableName}
                        WHERE ${whereConditions} AND SlNo != @id
                    `, inputs);

                    if (existing.length > 0 && !existing[0].IsDelete) {
                        const colLabels = constraintCols.map(col => {
                            const colConfig = config.columns.find(c => typeof c === 'object' && c.accessor === col);
                            return colConfig?.label || col;
                        }).join(' + ');
                        return NextResponse.json({
                            error: `${colLabels} combination already exists. Please use the data table to search and modify if needed.`
                        }, { status: 409 });
                    }
                }
            }

            const auditCols = ['createdby', 'createddate', 'updatedby', 'updateddate', 'isdelete'];
            const keys = Object.keys(data).filter(k =>
                k !== 'SlNo' &&
                !auditCols.includes(k.toLowerCase())
            );

            const setClause = keys.map(k => `[${k}] = @${k}`).join(', ') + ', [UpdatedBy] = @UpdatedBy, [UpdatedDate] = GETDATE()';
            const userId = 2;

            const inputs = keys.map(k => {
                let type = 'NVarChar';
                if (typeof data[k] === 'number') type = 'Int';
                if (typeof data[k] === 'boolean') type = 'Bit';
                return { name: k, type, value: data[k] };
            });

            // Add UpdatedBy
            inputs.push({ name: 'UpdatedBy', type: 'Int', value: userId });
            inputs.push({ name: 'id', type: 'Int', value: id });

            const query = `UPDATE ${tableName} SET ${setClause} WHERE SlNo = @id`;
            await executeQuery(query, inputs);

            // Audit Log
            await executeQuery(`
                INSERT INTO [Master].[TblAuditLog] (Action, TableName, RecordId, NewValue, ActionBy)
                VALUES ('UPDATE', @table, @id, @val, 'Admin')
            `, [
                { name: 'table', type: 'VarChar', value: table },
                { name: 'id', type: 'Int', value: id },
                { name: 'val', type: 'NVarChar', value: JSON.stringify(data) }
            ]);

            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

            // Soft Delete
            await executeQuery(`UPDATE ${tableName} SET IsDelete = 1, UpdatedDate = GETDATE() WHERE SlNo = @id`, [
                { name: 'id', type: 'Int', value: id }
            ]);

            // Audit Log
            await executeQuery(`
                INSERT INTO [Master].[TblAuditLog] (Action, TableName, RecordId, ActionBy)
                VALUES ('DELETE', @table, @idStr, 'Admin')
            `, [
                { name: 'table', type: 'VarChar', value: table },
                { name: 'idStr', type: 'VarChar', value: id.toString() }
            ]);

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error("CRUD API Error:", error);
        logger.error(`CRUD API Error [${body?.action || 'unknown'}]: ${error.message}`, { stack: error.stack, table: body?.table });
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
