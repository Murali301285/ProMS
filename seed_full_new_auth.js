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

async function seedFullAuth() {
    try {
        const pool = await sql.connect(config);
        console.log("Connected to DB...");

        // 1. Create TblRole_New
        await pool.request().query(`
            IF object_id('[Master].[TblRole_New]') IS NULL
            BEGIN
                CREATE TABLE [Master].[TblRole_New] (
                    SlNo INT IDENTITY(1,1) PRIMARY KEY,
                    RoleName NVARCHAR(100) NOT NULL UNIQUE,
                    Remarks NVARCHAR(MAX),
                    IsActive BIT DEFAULT 1,
                    IsDelete BIT DEFAULT 0,
                    CreatedDate DATETIME DEFAULT GETDATE(),
                    UpdatedDate DATETIME
                );
                PRINT 'TblRole_New created.';
            END
        `);

        // 2. Create TblUser_New
        await pool.request().query(`
            IF object_id('[Master].[TblUser_New]') IS NULL
            BEGIN
                CREATE TABLE [Master].[TblUser_New] (
                    SlNo INT IDENTITY(1,1) PRIMARY KEY,
                    UserName NVARCHAR(100) NOT NULL UNIQUE,
                    Password NVARCHAR(255) NOT NULL,
                    RoleId INT NOT NULL,
                    EmpName NVARCHAR(100),
                    ContactNo NVARCHAR(20),
                    EmailID NVARCHAR(100),
                    Remarks NVARCHAR(MAX),
                    IsActive BIT DEFAULT 1,
                    IsDelete BIT DEFAULT 0,
                    CreatedDate DATETIME DEFAULT GETDATE(),
                    UpdatedDate DATETIME,
                    CONSTRAINT FK_UserNew_Role FOREIGN KEY (RoleId) REFERENCES [Master].[TblRole_New](SlNo)
                );
                PRINT 'TblUser_New created.';
            END
        `);

        // 3. Update TblRoleAuthorization_New FK (If strictly necessary, but we might just conceptually link it for now if dropping constraints is complex. 
        // Let's ensure the table exists first.
        await pool.request().query(`
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
                    CONSTRAINT FK_NewAuth_Menu FOREIGN KEY (MenuId) REFERENCES [Master].[TblMenuMaster](MenuId)
                );
                PRINT 'TblRoleAuthorization_New created.';
            END
        `);
        // NOTE: We are NOT adding a formal FK to TblRole_New immediately to avoid conflict if the table already has data linked to old roles. 
        // Ideally we truncate it.
        await pool.request().query("TRUNCATE TABLE [Master].[TblRoleAuthorization_New]");
        console.log("Truncated TblRoleAuthorization_New for fresh start.");

        // 4. Insert Admin Role
        let roleRes = await executeQuery(pool, "SELECT SlNo FROM [Master].[TblRole_New] WHERE RoleName = 'Admin'");
        let roleId;
        if (roleRes.length === 0) {
            console.log("Creating Admin Role in TblRole_New...");
            await executeQuery(pool, "INSERT INTO [Master].[TblRole_New] (RoleName, Remarks, IsActive, IsDelete, CreatedDate) VALUES ('Admin', 'System Administrator', 1, 0, GETDATE())");
            roleRes = await executeQuery(pool, "SELECT SlNo FROM [Master].[TblRole_New] WHERE RoleName = 'Admin'");
        }
        roleId = roleRes[0].SlNo;
        console.log("Admin Role ID (New):", roleId);

        // 5. Insert Admin User
        let userRes = await executeQuery(pool, "SELECT SlNo FROM [Master].[TblUser_New] WHERE UserName = 'admin'");
        if (userRes.length === 0) {
            console.log("Creating Admin User in TblUser_New...");
            await executeQuery(pool, `
                INSERT INTO [Master].[TblUser_New] (UserName, Password, RoleId, EmpName, IsActive, IsDelete, CreatedDate) 
                VALUES ('admin', 'admin123', @roleId, 'System Admin', 1, 0, GETDATE())
            `, [{ name: 'roleId', value: roleId }]);
        } else {
            console.log("Updating Admin Password in TblUser_New...");
            await executeQuery(pool, "UPDATE [Master].[TblUser_New] SET Password = 'admin123', RoleId = @roleId WHERE UserName = 'admin'", [{ name: 'roleId', value: roleId }]);
        }

        // 6. Grant Permissions
        const menus = await executeQuery(pool, "SELECT MenuId FROM [Master].[TblMenuMaster] WHERE IsActive = 1 AND IsDelete = 0");
        console.log(`Found ${menus.length} active menus.`);

        if (menus.length > 0) {
            await executeQuery(pool, `
                INSERT INTO [Master].[TblRoleAuthorization_New] 
                (RoleId, MenuId, IsView, IsAdd, IsEdit, IsDelete, IsActive, IsDeleted, CreatedDate)
                SELECT 
                    @roleId, MenuId, 1, 1, 1, 1, 1, 0, GETDATE()
                FROM [Master].[TblMenuMaster]
                WHERE IsActive = 1 AND IsDelete = 0
            `, [{ name: 'roleId', value: roleId }]);
            console.log(`Granted full access to ${menus.length} menus for New Admin Role.`);
        }

        console.log("Seed Complete.");
        process.exit(0);

    } catch (error) {
        console.error("Seed Failed:", error);
        process.exit(1);
    }
}

seedFullAuth();
