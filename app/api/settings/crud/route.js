
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

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
            'TblStoppageReason', 'TblStrata', 'TblUnit'
        ];
        if (!validTables.includes(table)) return NextResponse.json({ message: 'Invalid table' }, { status: 403 });

        const tableName = `[Master].[${table}]`;

        if (action === 'read') {
            let query = `SELECT * FROM ${tableName}`;
            const queryParams = [];

            if (table === 'TblAuditLog') {
                const { filters } = body;
                if (filters && filters.fromDate && filters.toDate) {
                    query += ` WHERE ActionDate BETWEEN @fromDate AND @toDate`;
                    queryParams.push({ name: 'fromDate', type: 'VarChar', value: filters.fromDate });
                    queryParams.push({ name: 'toDate', type: 'VarChar', value: filters.toDate + ' 23:59:59' });
                }
                query += ` ORDER BY ActionDate DESC`;
            } else {
                query += ` WHERE IsDelete = 0`;
            }
            const result = await executeQuery(query, queryParams);
            return NextResponse.json(result);
        }

        if (action === 'create') {
            // Filter out any audit columns from the incoming data to prevent duplication
            const keys = Object.keys(data).filter(k => !['CreatedBy', 'CreatedDate', 'UpdatedBy', 'UpdatedDate', 'IsDelete'].includes(k));

            // Add Audit Columns
            const userId = 2; // Default to 'admin'
            keys.push('CreatedBy', 'CreatedDate', 'UpdatedBy', 'UpdatedDate', 'IsDelete');

            const cols = keys.join(', ');
            const vars = keys.map(k => k.includes('Date') ? 'GETDATE()' : `@${k}`).join(', ');

            // Construct inputs
            const inputs = keys.filter(k => !k.includes('Date')).map(k => {
                if (k === 'CreatedBy' || k === 'UpdatedBy') return { name: k, type: 'Int', value: userId };
                if (k === 'IsDelete') return { name: k, type: 'Bit', value: 0 };

                let type = 'NVarChar';
                if (typeof data[k] === 'number') type = 'Int';
                if (typeof data[k] === 'boolean') type = 'Bit';
                return { name: k, type, value: data[k] };
            });

            const query = `INSERT INTO ${tableName} (${cols}) VALUES (${vars})`;
            await executeQuery(query, inputs);

            // Audit Log
            await executeQuery(`
                INSERT INTO [Master].[TblAuditLog] (Action, TableName, NewValue, ActionBy)
                VALUES ('INSERT', @table, @val, 'Admin')
            `, [
                { name: 'table', type: 'VarChar', value: table },
                { name: 'val', type: 'NVarChar', value: JSON.stringify(data) }
            ]);

            return NextResponse.json({ success: true });
        }

        if (action === 'update') {
            if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

            const auditCols = ['createdby', 'createddate', 'updatedby', 'updateddate', 'isdelete'];
            const keys = Object.keys(data).filter(k =>
                k !== 'SlNo' &&
                !auditCols.includes(k.toLowerCase())
            );

            const setClause = keys.map(k => `${k} = @${k}`).join(', ') + ', UpdatedBy = @UpdatedBy, UpdatedDate = GETDATE()';
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
