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

async function run() {
    try {
        await sql.connect(config);
        const result = await sql.query("SELECT * FROM [Master].TblRoleAuthorization_New WHERE RoleId = 1 AND MenuId = 61");
        console.log(JSON.stringify(result.recordset, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

run();
