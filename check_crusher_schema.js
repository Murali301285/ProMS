
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkCrusherSchema() {
    try {
        await sql.connect(config);
        const result = await sql.query("SELECT TOP 1 * FROM [Trans].[TblCrusher]");
        const columns = result.recordset.length > 0 ? Object.keys(result.recordset[0]) : [];

        if (columns.length === 0) {
            // If empty, get from sys.columns
            const tableCheck = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblCrusher'
        `);

            if (tableCheck.recordset.length > 0) {
                console.log("Columns:", tableCheck.recordset);
            } else {
                console.log("Columns from Valid Record:", columns);
            }

        } else {
            console.log("Columns from Valid Record:", columns);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkCrusherSchema();
