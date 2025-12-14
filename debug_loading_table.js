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
    }
};

async function checkLoadingTable() {
    try {
        await sql.connect(config);
        console.log("✅ Connected to DB");

        const res = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblLoading'
        `);

        console.log("Columns in TblLoading:", res.recordset.map(c => c.COLUMN_NAME).join(', '));

        // Also check if 'IsDelete' exists
        const hasIsDelete = res.recordset.some(c => c.COLUMN_NAME === 'IsDelete');
        console.log("Has IsDelete:", hasIsDelete);

    } catch (e) {
        console.error("Query Failed:", e);
    } finally {
        await sql.close();
    }
}

checkLoadingTable();
