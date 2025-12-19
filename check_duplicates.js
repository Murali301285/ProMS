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

async function checkDuplicates() {
    try {
        await sql.connect(config);

        console.log("--- Duplicate SubGroups ---");
        const dups = await sql.query(`
            SELECT SubGroupName, COUNT(*) as Count
            FROM [Master].[TblSubGroup]
            WHERE IsDelete = 0
            GROUP BY SubGroupName
            HAVING COUNT(*) > 1
        `);
        console.table(dups.recordset);

        console.log("\n--- Duplicate Modules ---");
        const modDups = await sql.query(`
            SELECT ModuleName, COUNT(*) as Count
            FROM [Master].[TblModule]
            WHERE IsDelete = 0
            GROUP BY ModuleName
            HAVING COUNT(*) > 1
        `);
        console.table(modDups.recordset);

    } catch (err) {
        console.error("SQL Error:", err);
    } finally {
        await sql.close();
    }
}

checkDuplicates();
