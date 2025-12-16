
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
};

async function checkOperator() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("--- Checking Operator 2257 ---");
        const res = await pool.request().query(`
            SELECT OperatorId, OperatorName, SubCategoryId, IsActive, IsDelete
            FROM [Master].[TblOperator]
            WHERE OperatorId = 2257
        `);
        console.table(res.recordset);

        console.log("\n--- Checking Total Operators Count (Active) ---");
        const res2 = await pool.request().query('SELECT COUNT(*) as Count FROM [Master].[TblOperator] WHERE IsActive = 1');
        console.log(res2.recordset[0]);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkOperator();
