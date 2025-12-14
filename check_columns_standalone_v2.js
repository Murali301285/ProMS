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

async function checkColumns() {
    try {
        console.log("Connecting...");
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("Checking [Master].[TblQtyTripMapping] columns...");
        const cols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblQtyTripMapping' AND TABLE_SCHEMA = 'Master'");
        console.table(cols.recordset);

        console.log("Checking [Master].[TblEquipmentGroup] columns...");
        const cols2 = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblEquipmentGroup' AND TABLE_SCHEMA = 'Master'");
        console.table(cols2.recordset);

        pool.close();
    } catch (err) {
        console.error(err);
    }
}

checkColumns();
