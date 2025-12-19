
const { cookies } = require('next/headers'); // Mocking for standalone not easy with next/headers
// We'll use a simple fetch against the running server
// But wait, the server needs to be running.
// Let's make a script that uses the existing DB connection to simulate the API logic directly.

const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProdMS_live', // Assuming Live based on previous logs, or ProMS_Dev based on env. Let's try ProdMS_live first as that's where we saw data.
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function checkMenu() {
    try {
        await sql.connect(config);
        const roleId = 1; // Admin

        console.log("Connected to DB. Checking Menu for Role:", roleId);

        // Reproduce the query from api/setup/menu-tree
        const authorizedPages = await sql.query(`
            SELECT 
                MA.ModuleId,
                MA.SubGroupId,
                P.SlNo as PageId,
                P.PageName,
                P.PagePath as Url,
                MA.SortOrder
            FROM [Master].[TblMenuAllocation] MA
            INNER JOIN [Master].[TblPage] P ON MA.PageId = P.SlNo
            INNER JOIN [Master].[TblRoleAuthorization_New] RA ON RA.PageId = P.SlNo
            WHERE 
                MA.IsActive = 1 AND MA.IsDelete = 0
                AND P.IsActive = 1 AND P.IsDelete = 0
                AND RA.RoleId = ${roleId} AND RA.IsView = 1
                AND RA.IsActive = 1 AND RA.IsDelete = 0
            ORDER BY MA.SortOrder
        `);

        console.log(`Found ${authorizedPages.recordset.length} authorized pages.`);
        if (authorizedPages.recordset.length > 0) {
            console.log("Sample Page:", authorizedPages.recordset[0]);
        } else {
            console.log("No pages found! Checking raw counts...");
            const authCount = await sql.query(`SELECT COUNT(*) as C FROM [Master].[TblRoleAuthorization_New] WHERE RoleId = 1`);
            console.log("Total Auth Records for Role 1:", authCount.recordset[0].C);

            const allocCount = await sql.query(`SELECT COUNT(*) as C FROM [Master].[TblMenuAllocation]`);
            console.log("Total Allocation Records:", allocCount.recordset[0].C);
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkMenu();
