import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
import { MASTER_CONFIG } from '@/lib/masterConfig';

export async function POST(req) {
    try {
        const { table, nameField, valueField, filter, includeDeleted, additionalColumns } = await req.json();
        console.log(`📋 DDL API Request: table=${table}, nameField=${nameField}, valueField=${valueField}, filter=`, filter);

        if (!table || !nameField || !valueField) {
            return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
        }

        const safeTable = table.replace(/[^a-zA-Z0-9-]/g, '');
        const fullTableName = `[Master].[${MASTER_CONFIG[safeTable]?.table.replace('[Master].[', '').replace(']', '') || `Tbl${safeTable}`}]`;
        console.log(`📋 DDL API Full Table Name: ${fullTableName}`);

        // Base query with column existence checks
        let cols = [`${valueField} as id`, `${nameField} as name`];
        if (additionalColumns && Array.isArray(additionalColumns)) {
            additionalColumns.forEach(col => cols.push(col));
        }

        let query = `
            SELECT ${cols.join(', ')}
            FROM ${fullTableName}
            WHERE 1=1
        `;

        if (!includeDeleted) {
            query += ` AND (CASE WHEN COL_LENGTH('${fullTableName}', 'IsDelete') IS NOT NULL THEN IsDelete ELSE 0 END) = 0`;
        }

        query += ` AND (CASE WHEN COL_LENGTH('${fullTableName}', 'IsActive') IS NOT NULL THEN IsActive ELSE 1 END) = 1`;

        // Apply additional filters if provided
        if (filter && typeof filter === 'object') {
            Object.entries(filter).forEach(([key, value]) => {
                if (typeof value === 'number' || typeof value === 'boolean') {
                    query += ` AND ${key} = ${value}`;
                } else if (typeof value === 'string') {
                    query += ` AND ${key} = '${value.replace(/'/g, "''")}'`;
                } else if (Array.isArray(value) && value.length > 0) {
                    // Check if array elements are numbers or strings
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
