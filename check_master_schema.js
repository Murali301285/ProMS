
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

async function checkSchema() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();

        const tables = ['TblScale', 'TblStrata', 'TblDepthSlab'];

        for (const table of tables) {
            console.log(`\n--- ${table} Columns ---`);
            const result = await pool.request().query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${table}' AND TABLE_SCHEMA = 'Master'
            `);
            console.table(result.recordset);
        }

        pool.close();
    } catch (err) {
        console.error("Schema Check Failed:", err);
    }
}

checkSchema();
