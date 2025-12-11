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
    connectionTimeout: 30000,
    requestTimeout: 30000,
};

async function checkDeletedMaterials() {
    console.log("--- DELETED CHECK ---");
    try {
        await sql.connect(config);

        const query = `SELECT SlNo, MaterialName, IsDelete FROM [Master].[TblMaterial] WHERE SlNo IN (10, 13, 14)`;
        const result = await sql.query(query);
        console.table(result.recordset);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sql.close();
    }
    console.log("--- END ---");
}

checkDeletedMaterials();
