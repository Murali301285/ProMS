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

async function debugSP() {
    try {
        await sql.connect(config);
        const request = new sql.Request();

        // Use a date that is likely to have data
        // Checking for today or a known past date
        request.input('Date', sql.Date, '2025-12-01');

        const result = await request.execute('ProMS2_SPReportCrusherStoppageCumulative');

        console.log("Recordsets count:", result.recordsets.length);
        if (result.recordsets.length > 0) {
            const firstRow = result.recordsets[0][0];
            if (firstRow) {
                console.log("First Metadata Row Keys:", Object.keys(firstRow));
                console.log("First Row Data:", JSON.stringify(firstRow, null, 2));
            } else {
                console.log("First recordset is empty");
            }
        } else {
            console.log("No data returned");
        }
        await sql.close();
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

debugSP();
