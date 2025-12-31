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

        console.log('--- Checking Electrical Entry ---');
        const res1 = await sql.query(`
            SELECT TOP 1 Date, CreatedBy, CreatedDate 
            FROM [Trans].[TblElectricalEntry] 
            ORDER BY SlNo DESC
        `);
        console.table(res1.recordset);

        console.log('--- Checking Water Tanker Entry ---');
        const res2 = await sql.query(`
             SELECT TOP 1 EntryDate, CreatedBy, CreatedDate
             FROM [Transaction].[TblWaterTankerEntry]
             ORDER BY SlNo DESC
        `);
        console.table(res2.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

check();
