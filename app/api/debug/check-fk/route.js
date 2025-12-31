import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function GET() {
    try {
        console.log("Checking FK Constraints on [Trans].[TblLoading] via API...");
        const pool = await getDbConnection();
        const query = `
            SELECT 
                fk.name AS ForeignKeyName,
                OBJECT_NAME(fk.parent_object_id) AS TableName,
                c.name AS ColumnName,
                OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable
            FROM 
                sys.foreign_keys AS fk
            INNER JOIN 
                sys.foreign_key_columns AS fkc ON fk.object_id = fkc.constraint_object_id
            INNER JOIN 
                sys.columns AS c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
            WHERE 
                fk.parent_object_id = OBJECT_ID('Trans.TblLoading')
        `;
        const res = await pool.request().query(query);
        return NextResponse.json({ success: true, data: res.recordset });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message });
    }
}
