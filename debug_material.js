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

async function checkMaterial() {
    console.log("--- MATERIAL CHECK ---");
    try {
        await sql.connect(config);
        console.log("Connected.");

        const query = `
            SELECT Top 5 SlNo as id, MaterialName as name
            FROM [Master].[TblMaterial]
            WHERE SlNo = 10 OR IsActive = 1
            ORDER BY MaterialName ASC
        `;
        const result = await sql.query(query);
        console.log("Lookup Data Sample:", result.recordset);

        const hasId10 = result.recordset.find(r => r.id == 10);
        console.log("Has ID 10:", !!hasId10);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sql.close();
    }
    console.log("--- END ---");
}

checkMaterial();
