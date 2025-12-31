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

        console.log('--- Top 5 Users from [Master].[TblUser] ---');
        try {
            const users = await sql.query(`SELECT TOP 5 * FROM [Master].[TblUser]`);
            console.table(users.recordset);
        } catch (e) { console.log("TblUser query failed", e.message); }

        console.log('--- Top 5 Water Tanker Entries ---');
        const entries = await sql.query(`SELECT TOP 5 SlNo, CreatedBy, UpdatedBy FROM [Transaction].[TblWaterTankerEntry]`);
        console.table(entries.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

check();
