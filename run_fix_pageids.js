const sql = require('mssql');
const fs = require('fs');

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
        const pool = await sql.connect(config);
        const script = fs.readFileSync('fix_missing_pageids.sql', 'utf8');
        await pool.request().query(script);
        console.log('PageId fix script executed successfully.');
    } catch (err) {
        console.error('SQL Error:', err);
    } finally {
        await sql.close();
    }
}

run();
