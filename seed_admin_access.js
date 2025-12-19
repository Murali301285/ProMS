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

async function executeQuery(query, params = []) {
    const pool = await sql.connect(config);
    const request = pool.request();
    params.forEach(p => {
        request.input(p.name, p.value);
    });
    const result = await request.query(query);
    return result.recordset;
}

async function seed() {
    try {
        console.log("Seeding Admin Access...");

        // 1. Ensure Admin Role
        let roleRes = await executeQuery("SELECT SlNo FROM [Master].[TblRole] WHERE RoleName = 'Admin'");
        let roleId;
        if (roleRes.length === 0) {
            console.log("Creating Admin Role...");
            await executeQuery("INSERT INTO [Master].[TblRole] (RoleName, Remarks, IsActive, IsDelete, CreatedDate) VALUES ('Admin', 'System Administrator', 1, 0, GETDATE())");
            roleRes = await executeQuery("SELECT SlNo FROM [Master].[TblRole] WHERE RoleName = 'Admin'");
        }
        roleId = roleRes[0].SlNo;
        console.log("Admin Role ID:", roleId);

        // 2. Ensure Admin User
        let userRes = await executeQuery("SELECT SlNo FROM [Master].[TblUser] WHERE UserName = 'admin'");
        if (userRes.length === 0) {
            console.log("Creating Admin User...");
            await executeQuery(`
                INSERT INTO [Master].[TblUser] (UserName, Password, RoleId, EmpName, IsActive, IsDelete, CreatedDate) 
                VALUES ('admin', 'admin123', @roleId, 'System Admin', 1, 0, GETDATE())
            `, [{ name: 'roleId', value: roleId }]);
        } else {
            console.log("Updating Admin User Password...");
            await executeQuery("UPDATE [Master].[TblUser] SET Password = 'admin123' WHERE UserName = 'admin'");
        }
        console.log("Admin User ensured.");

        // 3. Get Menu IDs
        const menus = await executeQuery(`
            SELECT MenuId, Menuname FROM [Master].[TblMenuMaster] 
            WHERE Menuname IN ('Authorization', 'Role Master', 'User Management', 'Role Authorization', 'User', 'User Master')
        `);

        console.log("Found Menus:", menus);

        // 4. Grant Access
        for (const m of menus) {
            const existing = await executeQuery(
                "SELECT Permissionid FROM [Master].[TblRoleAuthorization] WHERE RoleId = @roleId AND MenuId = @menuId",
                [{ name: 'roleId', value: roleId }, { name: 'menuId', value: m.MenuId }]
            );

            if (existing.length === 0) {
                console.log(`Granting access to ${m.Menuname} (${m.MenuId})...`);
                await executeQuery(`
                    INSERT INTO [Master].[TblRoleAuthorization] 
                    (RoleId, MenuId, IsView, IsAdd, IsEdit, IsDelete, IsActive, IsDeleted, CreatedDate)
                    VALUES 
                    (@roleId, @menuId, 1, 1, 1, 1, 1, 0, GETDATE())
                `, [{ name: 'roleId', value: roleId }, { name: 'menuId', value: m.MenuId }]);
            }
        }

        console.log("Seeding Complete.");
        process.exit(0);

    } catch (error) {
        console.error("Seeding Failed:", error);
        process.exit(1);
    }
}

seed();
