
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

async function checkReportsAccess() {
    try {
        await sql.connect(config);
        const roleId = 1; // Assuming Admin
        console.log("Checking for Role:", roleId);

        // Check Module Existence
        const module = await sql.query("SELECT * FROM [Master].[TblModule] WHERE ModuleName = 'Reports'");
        console.log("Module Reports:", module.recordset);

        if (module.recordset.length === 0) return;
        const moduleId = module.recordset[0].SlNo;

        // Check Pages in Module
        const pages = await sql.query(`
            SELECT P.SlNo, P.PageName, M.SlNo as AllocationId, M.ModuleId, M.SubGroupId
            FROM [Master].[TblPage] P
            JOIN [Master].[TblMenuAllocation] M ON M.PageId = P.SlNo
            WHERE M.ModuleId = ${moduleId}
        `);
        console.log("Pages in Reports:", pages.recordset);

        if (pages.recordset.length === 0) {
            console.log("No pages found allocated to Reports module!");
            return;
        }

        // Check Auth
        const pageIds = pages.recordset.map(p => p.SlNo).join(',');
        const auth = await sql.query(`
            SELECT * FROM [Master].[TblRoleAuthorization_New] 
            WHERE RoleId = ${roleId} AND PageId IN (${pageIds})
        `);
        console.log("Auth Records:", auth.recordset);

    } catch (err) {
        console.error("SQL Error:", err);
    } finally {
        await sql.close();
    }
}

checkReportsAccess();
