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

async function checkRest() {
    try {
        await sql.connect(config);

        console.log("--- TblPatch Check ---");
        const patch = await sql.query(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME LIKE '%Patch%' OR TABLE_NAME LIKE '%Sector%'
        `);
        console.log("Tables:", patch.recordset);

        // Check if Source has columns for Patch/Sector
        // Or if TblLoading has them? (Confirmed No in previous step)

    } catch (err) {
        console.error("SQL Error:", err);
    } finally {
        await sql.close();
    }
}

checkRest();
