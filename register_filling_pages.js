
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

async function registerPages() {
    try {
        console.log('Connecting to database...');
        const pool = await new sql.ConnectionPool(config).connect();

        // 1. Get Module ID for 'Master'
        const modRes = await pool.request().query("SELECT SlNo FROM [Master].[TblModule] WHERE ModuleName = 'Master'");
        const moduleId = modRes.recordset[0]?.SlNo;

        if (!moduleId) {
            console.error('Master module not found!');
            process.exit(1);
        }
        console.log(`Found Master Module ID: ${moduleId}`);

        const pages = [
            { name: 'Filling Point', path: '/dashboard/master/filling-point' },
            { name: 'Filling Pump', path: '/dashboard/master/filling-pump' }
        ];

        for (const page of pages) {
            // 2. Insert into TblPage if not exists
            let pageId;
            const pageRes = await pool.request()
                .input('name', sql.VarChar, page.name)
                .input('path', sql.VarChar, page.path)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM [Master].[TblPage] WHERE PagePath = @path)
                    BEGIN
                        INSERT INTO [Master].[TblPage] (PageName, PagePath, IsActive, IsDelete, CreatedBy, CreatedDate)
                        VALUES (@name, @path, 1, 0, 'Admin', GETDATE());
                        SELECT SCOPE_IDENTITY() as SlNo;
                    END
                    ELSE
                    BEGIN
                        SELECT SlNo FROM [Master].[TblPage] WHERE PagePath = @path;
                    END
                `);

            pageId = pageRes.recordset[0]?.SlNo;
            console.log(`Page '${page.name}' ID: ${pageId}`);

            // 3. Insert into TblMenuAllocation if not exists
            await pool.request()
                .input('mid', sql.Int, moduleId)
                .input('pid', sql.Int, pageId)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM [Master].[TblMenuAllocation] WHERE ModuleId = @mid AND PageId = @pid)
                    BEGIN
                        DECLARE @MaxSort int;
                        SELECT @MaxSort = ISNULL(MAX(SortOrder), 0) FROM [Master].[TblMenuAllocation] WHERE ModuleId = @mid;
                        
                        INSERT INTO [Master].[TblMenuAllocation] (ModuleId, SubGroupId, PageId, SortOrder, IsActive, IsDelete, CreatedBy, CreatedDate)
                        VALUES (@mid, NULL, @pid, @MaxSort + 1, 1, 0, 'Admin', GETDATE());
                        PRINT 'Allocated to Menu';
                    END
                `);

            // 4. Authorize for Admin (Role ID 2)
            const roleId = 2;
            await pool.request()
                .input('rid', sql.Int, roleId)
                .input('pid', sql.Int, pageId)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM [Master].[TblRoleAuthorization_New] WHERE RoleId = @rid AND PageId = @pid)
                    BEGIN
                        INSERT INTO [Master].[TblRoleAuthorization_New] (RoleId, PageId, IsView, IsCreate, IsEdit, IsDelete, IsExport, IsActive, CreatedBy, CreatedDate)
                        VALUES (@rid, @pid, 1, 1, 1, 1, 1, 1, 'Admin', GETDATE());
                        PRINT 'Authorized for Admin';
                    END
                `);
        }

        console.log('Pages registered successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Registration failed:', err);
        process.exit(1);
    }
}

registerPages();
