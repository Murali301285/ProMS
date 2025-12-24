
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

async function run() {
    try {
        console.log("Connecting...");
        const pool = await new sql.ConnectionPool(config).connect();

        // 1. Get Module
        const mod = await pool.request().query("SELECT SlNo FROM [Master].[TblModule] WHERE ModuleName = 'Master'");
        const moduleId = mod.recordset[0]?.SlNo;
        console.log("Module ID:", moduleId);

        const pages = [
            { name: 'Filling Point', path: '/dashboard/master/filling-point' },
            { name: 'Filling Pump', path: '/dashboard/master/filling-pump' }
        ];

        for (const p of pages) {
            console.log(`Processing ${p.name}...`);

            // Check existence
            const check = await pool.request()
                .input('path', sql.VarChar, p.path)
                .query("SELECT SlNo FROM [Master].[TblPage] WHERE PagePath = @path");

            let pageId = check.recordset[0]?.SlNo;

            if (!pageId) {
                console.log(`Inserting ${p.name}...`);
                const res = await pool.request()
                    .input('name', p.name)
                    .input('path', p.path)
                    .query("INSERT INTO [Master].[TblPage] (PageName, PagePath, IsActive, IsDelete, CreatedBy, CreatedDate) VALUES (@name, @path, 1, 0, 'Admin', GETDATE()); SELECT SCOPE_IDENTITY() AS ID;");
                pageId = res.recordset[0].ID;
                console.log(`inserted pageId: ${pageId}`);
            } else {
                console.log(`Page exists: ${pageId}`);
            }

            // Allocation
            const allocCheck = await pool.request()
                .input('mid', moduleId)
                .input('pid', pageId)
                .query("SELECT SlNo FROM [Master].[TblMenuAllocation] WHERE ModuleId = @mid AND PageId = @pid");

            if (allocCheck.recordset.length === 0) {
                console.log("Allocating...");
                const sortRes = await pool.request().input('mid', moduleId).query("SELECT MAX(SortOrder) as mx FROM [Master].[TblMenuAllocation] WHERE ModuleId = @mid");
                const sort = (sortRes.recordset[0].mx || 0) + 1;

                await pool.request()
                    .input('mid', moduleId)
                    .input('pid', pageId)
                    .input('sort', sort)
                    .query("INSERT INTO [Master].[TblMenuAllocation] (ModuleId, PageId, SortOrder, IsActive, IsDelete, CreatedBy, CreatedDate) VALUES (@mid, @pid, @sort, 1, 0, 'Admin', GETDATE())");
                console.log("Allocated.");
            } else {
                console.log("Already allocated.");
            }

            // Auth - FIX: Use PermissionId, IsAdd, omit IsExport/CreatedBy
            const roleId = 2;
            const authCheck = await pool.request()
                .input('rid', roleId)
                .input('pid', pageId)
                .query("SELECT PermissionId FROM [Master].[TblRoleAuthorization_New] WHERE RoleId = @rid AND PageId = @pid");

            if (authCheck.recordset.length === 0) {
                console.log("Authorizing...");
                await pool.request()
                    .input('rid', roleId)
                    .input('pid', pageId)
                    .query("INSERT INTO [Master].[TblRoleAuthorization_New] (RoleId, PageId, IsView, IsAdd, IsEdit, IsDelete, IsActive, CreatedDate) VALUES (@rid, @pid, 1, 1, 1, 1, 1, GETDATE())");
                console.log("Authorized.");
            } else {
                console.log("Already authorized.");
            }
        }

        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}
run();
