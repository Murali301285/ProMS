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

async function checkTable() {
    try {
        await sql.connect(config);
        console.log("✅ Connected to DB");

        const res = await sql.query(`
            SELECT * FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblLoadingShiftIncharge'
        `);

        if (res.recordset.length > 0) {
            console.log("✅ Table [Trans].[TblLoadingShiftIncharge] EXISTS.");

            // Check Columns
            const cols = await sql.query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblLoadingShiftIncharge'
            `);
            console.log("Columns:", cols.recordset);
        } else {
            console.error("❌ Table [Trans].[TblLoadingShiftIncharge] DOES NOT EXIST.");
        }
    } catch (e) {
        console.error("Query Failed:", e);
    } finally {
        await sql.close();
    }
}

checkTable();
