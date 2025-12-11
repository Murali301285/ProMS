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

async function checkSMESupplierSchema() {
    console.log("--- SCHEMA CHECK SME ---");
    try {
        await sql.connect(config);

        const query = `
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' 
            AND TABLE_NAME = 'TblSMESupplier'
            AND COLUMN_NAME = 'SMECategoryId'
        `;
        const result = await sql.query(query);
        console.log("Has SMECategoryId:", result.recordset.length > 0);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sql.close();
    }
    console.log("--- END ---");
}

checkSMESupplierSchema();
