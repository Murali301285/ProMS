
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkSchema() {
    try {
        await sql.connect(config);

        console.log("Checking TblEquipment...");
        const r1 = await sql.query("SELECT TOP 1 * FROM [Master].[TblEquipment]");
        const cols1 = r1.recordset.length > 0 ? Object.keys(r1.recordset[0]) : [];
        console.log("Equipment Cols:", cols1);
        console.log("Has ActivityId:", cols1.includes('ActivityId'));

        console.log("Checking TblOperator...");
        const r2 = await sql.query("SELECT TOP 1 * FROM [Master].[TblOperator]");
        const cols2 = r2.recordset.length > 0 ? Object.keys(r2.recordset[0]) : [];
        console.log("Operator Cols:", cols2);
        console.log("Has SubCategoryId:", cols2.includes('SubCategoryId'));

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkSchema();
