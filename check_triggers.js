
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

async function checkTriggers() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();

        const tables = ['[Master].[TblPage]', '[Master].[TblMenuAllocation]', '[Master].[TblRoleAuthorization_New]'];

        for (const table of tables) {
            console.log(`Checking triggers for ${table}...`);
            const res = await pool.request().query(`
                SELECT name, OBJECT_DEFINITION(object_id) as definition 
                FROM sys.triggers 
                WHERE parent_id = OBJECT_ID('${table}')
            `);
            if (res.recordset.length > 0) {
                console.log(`Found ${res.recordset.length} triggers on ${table}:`);
                res.recordset.forEach(t => {
                    console.log(`- ${t.name}`);
                    // console.log(t.definition); // Too verbose, just start with names
                });
            } else {
                console.log(`No triggers found on ${table}.`);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkTriggers();
