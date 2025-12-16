
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

async function checkOperatorSlNo() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("--- Checking Operator with SlNo 2257 ---");
        const res = await pool.request().query(`
            SELECT SlNo, OperatorId, OperatorName 
            FROM [Master].[TblOperator] 
            WHERE SlNo = 2257
        `);
        console.table(res.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkOperatorSlNo();
