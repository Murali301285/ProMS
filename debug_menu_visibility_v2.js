const { executeQuery } = require('./lib/db');

async function debugMenu() {
    try {
        console.log("--- Debugging Menu Visibility ---");

        // 1. Find 'Home' Page and its Module
        const homePage = await executeQuery(`
            SELECT TOP 1 P.SlNo as PageId, P.PageName, M.SlNo as ModuleId, M.ModuleName, MA.SubGroupId 
            FROM [Master].[TblPage] P
            JOIN [Master].[TblMenuAllocation] MA ON P.SlNo = MA.PageId
            JOIN [Master].[TblModule] M ON MA.ModuleId = M.SlNo
            WHERE P.PageName LIKE '%Home%'
        `);
        console.log("Home Page Details:", homePage);

        if (homePage.length > 0) {
            const correctModuleId = homePage[0].ModuleId;

            // 2. Check 'Drilling & Blasting'
            const drillPage = await executeQuery(`
                SELECT P.SlNo as PageId, P.PageName, MA.ModuleId, MA.SubGroupId 
                FROM [Master].[TblPage] P
                LEFT JOIN [Master].[TblMenuAllocation] MA ON P.SlNo = MA.PageId
                WHERE P.PagePath = '/dashboard/drilling-blasting'
            `);
            console.log("Drilling Page Details:", drillPage);

            // 3. Check 'Crushing'
            const crushPage = await executeQuery(`
                SELECT P.SlNo as PageId, P.PageName, MA.ModuleId, MA.SubGroupId 
                FROM [Master].[TblPage] P
                LEFT JOIN [Master].[TblMenuAllocation] MA ON P.SlNo = MA.PageId
                WHERE P.PagePath = '/dashboard/crushing'
            `);
            console.log("Crushing Page Details:", crushPage);

            // 4. Check Authorization for Drilling Page (Sample)
            if (drillPage.length > 0) {
                const auths = await executeQuery(`
                    SELECT COUNT(*) as Count, RoleId, IsView 
                    FROM [Master].[TblRoleAuthorization_New] 
                    WHERE PageId = ${drillPage[0].PageId}
                    GROUP BY RoleId, IsView
                `);
                console.log("Auth Counts for Drilling:", auths);
            }
        }

    } catch (e) {
        console.error(e);
    }
}

debugMenu();
