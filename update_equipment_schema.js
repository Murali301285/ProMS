
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
    }
};

async function updateSchema() {
    try {
        console.log('Connecting to database...');
        const pool = await new sql.ConnectionPool(config).connect();

        console.log('Adding Capacity column...');
        await pool.request().query("IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblEquipment' AND COLUMN_NAME = 'Capacity') BEGIN ALTER TABLE [Master].[TblEquipment] ADD Capacity DECIMAL(18,3) NULL END");

        console.log('Adding UnitId column...');
        await pool.request().query("IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblEquipment' AND COLUMN_NAME = 'UnitId') BEGIN ALTER TABLE [Master].[TblEquipment] ADD UnitId INT NULL END");

        console.log('Schema update complete.');
        process.exit(0);
    } catch (err) {
        console.error('Schema update failed:', err);
        process.exit(1);
    }
}

updateSchema();
