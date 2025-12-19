
const { executeQuery } = require('./lib/db');

async function checkReportsAccess() {
    const roleId = 1; // Assuming Admin
    console.log("Checking for Role:", roleId);

    // Check Module Existence
    const module = await executeQuery("SELECT * FROM [Master].[TblModule] WHERE ModuleName = 'Reports'");
    console.log("Module Reports:", module);

    if (module.length === 0) return;
    const moduleId = module[0].SlNo;

    // Check Pages in Module
    const pages = await executeQuery(`
        SELECT P.SlNo, P.PageName, M.SlNo as AllocationId
        FROM [Master].[TblPage] P
        JOIN [Master].[TblMenuAllocation] M ON M.PageId = P.SlNo
        WHERE M.ModuleId = ${moduleId}
    `);
    console.log("Pages in Reports:", pages);

    // Check Auth
    const auth = await executeQuery(`
        SELECT * FROM [Master].[TblRoleAuthorization_New] 
        WHERE RoleId = ${roleId} AND PageId IN (${pages.map(p => p.SlNo).join(',') || 0})
    `);
    console.log("Auth Records:", auth);
}

checkReportsAccess().then(() => process.exit(0)).catch(e => console.error(e));
