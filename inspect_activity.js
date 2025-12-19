const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkActivitySchema() {
    try {
        await sql.connect(config);

        console.log("--- TblActivity Columns ---");
        const cols = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblActivity' AND TABLE_SCHEMA = 'Master'
        `);
        console.log(cols.recordset.map(c => c.COLUMN_NAME).join(', '));

        // Use wildcard to list content safely
        console.log("\n--- Activity Content ---");
        const content = await sql.query(`SELECT * FROM [Master].TblActivity`);
        console.table(content.recordset);

    } catch (err) {
        console.error("SQL Error:", err);
    } finally {
        await sql.close();
    }
}

checkActivitySchema();
