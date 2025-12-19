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

async function executeQuery(pool, query, params = []) {
    const request = pool.request();
    params.forEach(p => {
        request.input(p.name, p.value);
    });
    const result = await request.query(query);
    return result.recordset;
}

async function seedNewAuth() {
    try {
        const pool = await sql.connect(config);
        console.log("Connected to DB...");

        // 1. Create Table if not exists
        const createTableQuery = `
            IF object_id('[Master].[TblRoleAuthorization_New]') IS NULL
            BEGIN
                CREATE TABLE [Master].[TblRoleAuthorization_New] (
                    PermissionId INT IDENTITY(1,1) PRIMARY KEY,
                    RoleId INT NOT NULL,
                    MenuId INT NOT NULL,
                    IsView BIT DEFAULT 0,
                    IsAdd BIT DEFAULT 0,
                    IsEdit BIT DEFAULT 0,
                    IsDelete BIT DEFAULT 0,
                    IsActive BIT DEFAULT 1,
                    IsDeleted BIT DEFAULT 0,
                    CreatedDate DATETIME DEFAULT GETDATE(),
                    UpdatedDate DATETIME,
                    CONSTRAINT FK_NewAuth_Role FOREIGN KEY (RoleId) REFERENCES [Master].[TblRole](SlNo),
                    CONSTRAINT FK_NewAuth_Menu FOREIGN KEY (MenuId) REFERENCES [Master].[TblMenuMaster](MenuId)
                );
                PRINT 'Table TblRoleAuthorization_New created.';
            END
            ELSE
            BEGIN
                PRINT 'Table TblRoleAuthorization_New already exists.';
            END
        `;
        await pool.request().query(createTableQuery);

        // 2. Get Admin Role ID
        const roles = await executeQuery(pool, "SELECT SlNo FROM [Master].[TblRole] WHERE RoleName = 'Admin'");
        if (roles.length === 0) {
            console.error("Admin Role not found! Please ensure 'Admin' role exists.");
            process.exit(1);
        }
        const roleId = roles[0].SlNo;
        console.log("Admin Role ID:", roleId);

        // 3. Clean existing Admin permissions in NEW table
        await executeQuery(pool, "DELETE FROM [Master].[TblRoleAuthorization_New] WHERE RoleId = @roleId", [{ name: 'roleId', value: roleId }]);
        console.log("Cleared existing Admin permissions in new table.");

        // 4. Insert Full Access for All Active Menus
        const menus = await executeQuery(pool, "SELECT MenuId FROM [Master].[TblMenuMaster] WHERE IsActive = 1 AND IsDelete = 0");
        console.log(`Found ${menus.length} active menus to assign.`);

        if (menus.length > 0) {
            // Bulk Insert is efficient, but loop is safer for simple script to avoid parameter limits if many menus
            // We'll do a single INSERT SELECT for efficiency
            await executeQuery(pool, `
                INSERT INTO [Master].[TblRoleAuthorization_New] 
                (RoleId, MenuId, IsView, IsAdd, IsEdit, IsDelete, IsActive, IsDeleted, CreatedDate)
                SELECT 
                    @roleId, MenuId, 1, 1, 1, 1, 1, 0, GETDATE()
                FROM [Master].[TblMenuMaster]
                WHERE IsActive = 1 AND IsDelete = 0
            `, [{ name: 'roleId', value: roleId }]);
            console.log(`Granted full access to ${menus.length} menus for Admin.`);
        }

        process.exit(0);

    } catch (error) {
        console.error("Seeding Failed:", error);
        process.exit(1);
    }
}

seedNewAuth();
