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

        console.log("--- TblModule ---");
        const modules = await sql.query("SELECT SlNo, ModuleName FROM [Master].TblModule WHERE IsDelete=0");
        console.table(modules.recordset);

        console.log("--- TblPage (Reports) ---");
        const pages = await sql.query("SELECT SlNo, PageName, PagePath FROM [Master].TblPage WHERE PagePath LIKE '%report%'");
        console.table(pages.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

run();
