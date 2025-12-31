
const { getDbConnection, sql } = require('./lib/db');

async function checkSchema() {
    try {
        const pool = await getDbConnection();
        // 1. Check Columns
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'TblDrilling' AND TABLE_SCHEMA = 'Trans'
        `);
        console.log("--- TblDrilling Columns ---");
        console.table(result.recordset);

        // 2. Check FKs
        const fks = await pool.request().query(`
             SELECT 
                fk.name AS ForeignKey,
                tp.name AS ParentTable,
                rc.name AS ParentColumn,
                tr.name AS ReferencedTable,
                rc2.name AS ReferencedColumn
            FROM sys.foreign_keys fk
            INNER JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
            INNER JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
            INNER JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
            INNER JOIN sys.columns rc ON fkc.parent_column_id = rc.column_id AND fkc.parent_object_id = rc.object_id
            INNER JOIN sys.columns rc2 ON fkc.referenced_column_id = rc2.column_id AND fkc.referenced_object_id = rc2.object_id
            WHERE tp.name = 'TblDrilling'
        `);
        console.log("--- TblDrilling FKs ---");
        console.table(fks.recordset);

    } catch (err) {
        console.error(err);
    }
}

checkSchema();
