

const fs = require('fs');
const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

async function checkFK() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();
        const result = await pool.request().query(`
            SELECT 
                f.name AS ForeignKey,
                OBJECT_NAME(f.parent_object_id) AS TableName,
                COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnName,
                OBJECT_NAME (f.referenced_object_id) AS ReferenceTableName,
                COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferenceColumnName
            FROM 
                sys.foreign_keys AS f
            INNER JOIN 
                sys.foreign_key_columns AS fc ON f.object_id = fc.constraint_object_id
            WHERE 
                OBJECT_NAME(f.parent_object_id) = 'TblDrilling'
        `);
        console.table(result.recordset);
        pool.close();
    } catch (err) {
        console.error("Check Failed:", err);
    }
}

checkFK();
