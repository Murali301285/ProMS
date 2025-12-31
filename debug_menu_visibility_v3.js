const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function debugMenu() {
    try {
        console.log("--- Debugging Menu Visibility v3 ---");
        await sql.connect(config);

        // 1. Find 'Home' Page and its Module
        const homePage = await sql.query(`
            SELECT TOP 1 P.SlNo as PageId, P.PageName, M.SlNo as ModuleId, M.ModuleName, MA.SubGroupId 
            FROM [Master].[TblPage] P
            JOIN [Master].[TblMenuAllocation] MA ON P.SlNo = MA.PageId
            JOIN [Master].[TblModule] M ON MA.ModuleId = M.SlNo
            WHERE P.PageName LIKE '%Home%'
        `);
        console.log("Home Page Details:", homePage.recordset);

        if (homePage.recordset.length > 0) {
            const correctModuleId = homePage.recordset[0].ModuleId;

            // 2. Check 'Drilling & Blasting'
            const drillPage = await sql.query(`
                SELECT P.SlNo as PageId, P.PageName, MA.ModuleId, MA.SubGroupId 
                FROM [Master].[TblPage] P
                LEFT JOIN [Master].[TblMenuAllocation] MA ON P.SlNo = MA.PageId
                WHERE P.PagePath = '/dashboard/drilling-blasting'
            `);
            console.log("Drilling Page Details:", drillPage.recordset);

            // 3. Check 'Crushing'
            const crushPage = await sql.query(`
                SELECT P.SlNo as PageId, P.PageName, MA.ModuleId, MA.SubGroupId 
                FROM [Master].[TblPage] P
                LEFT JOIN [Master].[TblMenuAllocation] MA ON P.SlNo = MA.PageId
                WHERE P.PagePath = '/dashboard/crushing'
            `);
            console.log("Crushing Page Details:", crushPage.recordset);

            // 4. Check Authorization Deeply
            const roleCount = await sql.query('SELECT count(*) as cnt FROM [Master].[TblRole_New] WHERE IsActive=1');
            console.log("Active Roles Count:", roleCount.recordset);

            if (drillPage.recordset.length > 0) {
                const auths = await sql.query(`
                    SELECT *
                    FROM [Master].[TblRoleAuthorization_New] 
                    WHERE PageId = ${drillPage.recordset[0].PageId}
                `);
                console.log("Direct Query of Auth Table for Drilling Page:", auths.recordset);
            }
        }

        await sql.close();

    } catch (e) {
        console.error(e);
    }
}

debugMenu();
