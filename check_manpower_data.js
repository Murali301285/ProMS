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

async function checkData() {
    try {
        await sql.connect(config);
        console.log("Connected.");

        const query = `
            SELECT TOP 5
                SlNo,
                ManPowerInShift
            FROM [Trans].[TblMaterialRehandling]
            ORDER BY RehandlingDate DESC
        `;

        const result = await sql.query(query);
        console.table(result.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkData();
