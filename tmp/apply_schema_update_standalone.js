const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS_Dev',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        await sql.connect(config);
        const query = fs.readFileSync(path.join(__dirname, 'update_equipment_schema.sql'), 'utf8');
        const result = await sql.query(query);
        console.log("Schema Update Success:", result);
    } catch (err) {
        console.error("SQL Error", err);
    } finally {
        sql.close();
    }
}

run();
