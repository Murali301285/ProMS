
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

async function checkOperatorData() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("--- Checking TblOperator Schema (Detail) ---");
        const schema = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblOperator'
            AND COLUMN_NAME = 'OperatorId'
        `);
        console.table(schema.recordset);

        console.log("--- Checking Operator Values like '2257' ---");
        // Use standard query
        const res = await pool.request().query(`
            SELECT TOP 5 OperatorId, OperatorName, SubCategoryId 
            FROM [Master].[TblOperator] 
            WHERE CAST(OperatorId AS NVARCHAR) LIKE '%2257%'
        `);
        console.table(res.recordset);

        console.log("--- Checking JHE40 ---");
        const res2 = await pool.request().query(`
            SELECT TOP 1 OperatorId, OperatorName 
            FROM [Master].[TblOperator] 
            WHERE CAST(OperatorId AS NVARCHAR) = 'JHE40'
        `);
        console.table(res2.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkOperatorData();
