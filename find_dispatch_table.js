const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

async function check() {
    try {
        await sql.connect(config);
        const tables = await sql.query(`
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME LIKE '%Dispatch%' OR TABLE_NAME LIKE '%Blasting%'
        `);
        console.table(tables.recordset);

        // Check columns if found
        if (tables.recordset.length > 0) {
            const tableName = tables.recordset[0].TABLE_NAME;
            const schema = tables.recordset[0].TABLE_SCHEMA;
            console.log(`Checking columns for ${schema}.${tableName}...`);
            const cols = await sql.query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${tableName}' 
                AND TABLE_SCHEMA = '${schema}'
                AND COLUMN_NAME IN ('CreatedBy', 'UpdatedBy')
            `);
            console.table(cols.recordset);

            // Check top 1 record
            const data = await sql.query(`SELECT TOP 1 CreatedBy FROM [${schema}].[${tableName}]`);
            console.table(data.recordset);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

check();
