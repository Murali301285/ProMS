import sql from 'mssql';

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

async function checkUnit() {
    try {
        console.log("Connecting...");
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("Checking [Master].[TblUnit] columns...");
        const cols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblUnit' AND TABLE_SCHEMA = 'Master'");
        console.table(cols.recordset);

        console.log("Checking [Master].[TblUnit] data...");
        const data = await pool.request().query("SELECT * FROM [Master].[TblUnit]");
        console.table(data.recordset);

        pool.close();
    } catch (err) {
        console.error(err);
    }
}

checkUnit();
