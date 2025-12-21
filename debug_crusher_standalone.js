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

async function run() {
    try {
        await sql.connect(config);

        console.log("--- TblCrusher Columns ---");
        const res1 = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblCrusher' AND TABLE_SCHEMA = 'Trans'
        `);
        console.log(res1.recordset.map(r => r.COLUMN_NAME).join(', '));

        console.log("\n--- TblCrusherStoppage Columns ---");
        const res2 = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblCrusherStoppage' AND TABLE_SCHEMA = 'Trans'
        `);
        console.log(res2.recordset.map(r => r.COLUMN_NAME).join(', '));

    } catch (err) {
        console.error("SQL Error:", err);
    } finally {
        await sql.close();
    }
}

run();
