import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import { MASTER_CONFIG } from '@/lib/masterConfig';

export async function POST(req) {
    try {
        const { table, nameField, valueField, filter, includeDeleted, additionalColumns, includeInactive } = await req.json();
        console.log(`📋 DDL API Request: table=${table}, nameField=${nameField}, valueField=${valueField}, filter=`, filter);

        if (!table || !nameField || !valueField) {
            return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
        }

        const safeTable = table.replace(/[^a-zA-Z0-9-]/g, '');
        const rawTableName = MASTER_CONFIG[safeTable]?.table.replace('[Master].[', '').replace(']', '') || `Tbl${safeTable}`;
        const fullTableName = `[Master].[${rawTableName}]`;
        console.log(`📋 DDL API Full Table Name: ${fullTableName}`);

        // 🔍 Query the actual columns of the table to build a safe static query
        const colCheckQuery = `
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = @tableName
        `;
        const columnsInDb = await executeQuery(colCheckQuery, [{ name: 'tableName', type: 'VarChar', value: rawTableName }]);
        const columnNames = columnsInDb.map(c => c.COLUMN_NAME.toLowerCase());
        console.log(`📋 Columns in ${rawTableName}:`, columnNames);

        // Base query construction
        let cols = [`${valueField} as id`, `${nameField} as name`];
        if (additionalColumns && Array.isArray(additionalColumns)) {
            additionalColumns.forEach(col => cols.push(col));
        }

        // Add dynamically calculated isActive status column
        let activeColExpression = '1 as isActive';
        if (columnNames.includes('isactive')) {
            activeColExpression = 'IsActive as isActive';
        } else if (columnNames.includes('active')) {
            activeColExpression = 'Active as isActive';
        }
        cols.push(activeColExpression);

        let query = `
            SELECT ${cols.join(', ')}
            FROM ${fullTableName}
            WHERE 1=1
        `;

        if (!includeDeleted && columnNames.includes('isdelete')) {
            query += ` AND IsDelete = 0`;
        }

        // Apply additional filters if provided
        if (filter && typeof filter === 'object') {
            Object.entries(filter).forEach(([key, value]) => {
                if (typeof value === 'number' || typeof value === 'boolean') {
                    query += ` AND ${key} = ${value}`;
                } else if (typeof value === 'string') {
                    query += ` AND ${key} = '${value.replace(/'/g, "''")}'`;
                } else if (Array.isArray(value) && value.length > 0) {
                    const isNumberArray = value.every(v => typeof v === 'number');
                    if (isNumberArray) {
                        query += ` AND ${key} IN (${value.join(',')})`;
                    } else {
                        const quotedValues = value.map(v => `'${String(v).replace(/'/g, "''")}'`).join(',');
                        query += ` AND ${key} IN (${quotedValues})`;
                    }
                }
            });
        }

        query += ` ORDER BY ${nameField} ASC`;

        console.log(`📋 DDL API Generated Query:\n${query}`);

        const result = await executeQuery(query);
        console.log(`📋 DDL API Result Count: ${result.length}`);
        return NextResponse.json(result);
    } catch (error) {
        console.error("❌ DDL API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
