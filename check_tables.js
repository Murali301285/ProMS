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

        console.log('--- Tables Matching User ---');
        const tables = await sql.query(`
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME LIKE '%User%'
        `);
        console.table(tables.recordset);

        // Check if TblUser_New exists explicitly
        try {
            const res = await sql.query(`SELECT TOP 1 * FROM [Master].[TblUser_New]`);
            console.log("TblUser_New Found!");
            console.table(res.recordset);
        } catch (e) {
            console.log("TblUser_New query error: " + e.message);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

check();
