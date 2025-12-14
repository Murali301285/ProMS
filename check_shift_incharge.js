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

async function checkShiftInchargeSchema() {
    console.log("--- SCHEMA CHECK: TblLoadingShiftIncharge ---");
    try {
        await sql.connect(config);

        const query = `
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' 
            AND TABLE_NAME = 'TblLoadingShiftIncharge'
        `;
        const result = await sql.query(query);
        console.table(result.recordset);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sql.close();
    }
    console.log("--- END ---");
}

checkShiftInchargeSchema();
