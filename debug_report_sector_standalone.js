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

async function runDebug() {
    try {
        console.log("Connecting...");
        const pool = await sql.connect(config);

        const date = '2025-12-01';
        console.log(`Executing SP for ${date}...`);

        const result = await pool.request()
            .input('Date', date)
            .query('EXEC ProMS2_SPReportOperatorPerformanceLoading @Date');

        const data = result.recordset || [];
        console.log("Total Rows:", data.length);
        if (data.length > 0) {
            console.log("First Row Sample:", JSON.stringify(data[0], null, 2));

            // Check specifically for Sector
            const hasSector = data.some(r => r.Sector !== null && r.Sector !== undefined);
            console.log("Any row has Sector data?", hasSector);

            // Check keys to see exact casing
            console.log("Keys in first row:", Object.keys(data[0]));
        } else {
            console.log("No data returned.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

runDebug();
