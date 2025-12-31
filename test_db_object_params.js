
const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433'),
    database: process.env.DB_DATABASE || 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

async function test() {
    try {
        console.log("Connecting...");
        const pool = await new sql.ConnectionPool(config).connect();
        console.log("Connected.");
        const request = pool.request();

        const params = {
            fromDate: '2025-12-01',
            toDate: '2025-12-29'
        };

        // Simulate logic in lib/db.js
        if (params && typeof params === 'object') {
            Object.keys(params).forEach(key => {
                console.log(`Adding Param: ${key} = ${params[key]}`);
                request.input(key, params[key]);
            });
        }

        const query = `
            SELECT count(*) as count
            FROM [Trans].[TblDispatchEntry] t
            WHERE CAST(t.Date AS DATE) >= @fromDate 
            AND CAST(t.Date AS DATE) <= @toDate
        `;

        const result = await request.query(query);
        console.log("Result:", result.recordset);
        pool.close();

    } catch (err) {
        console.error("Test Failed:", err);
    }
}

test();
