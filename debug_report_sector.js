const { getDbConnection } = require('./lib/db');

async function runDebug() {
    try {
        const pool = await getDbConnection();
        // Use a date known to have data, or dynamic
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

            // Check keys
            console.log("Keys in first row:", Object.keys(data[0]));
        } else {
            console.log("No data returned.");
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

runDebug();
