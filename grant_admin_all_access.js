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

async function grantAll() {
    try {
        const pool = await sql.connect(config);
        console.log("Connected to DB...");

        // 1. Get Admin Role ID
        const roles = await executeQuery(pool, "SELECT SlNo FROM [Master].[TblRole] WHERE RoleName = 'Admin'");
        if (roles.length === 0) {
            console.error("Admin Role not found!");
            process.exit(1);
        }
        const roleId = roles[0].SlNo;
        console.log("Admin Role ID:", roleId);

        // 2. Get All Active Menus
        const menus = await executeQuery(pool, "SELECT MenuId, Menuname FROM [Master].[TblMenuMaster] WHERE IsActive = 1 AND IsDelete = 0");
        console.log(`Found ${menus.length} active menus.`);

        // 3. Insert Permissions if missing
        let count = 0;
        for (const m of menus) {
            const existing = await executeQuery(pool,
                "SELECT Permissionid FROM [Master].[TblRoleAuthorization] WHERE RoleId = @roleId AND MenuId = @menuId",
                [{ name: 'roleId', value: roleId }, { name: 'menuId', value: m.MenuId }]
            );

            if (existing.length === 0) {
                await executeQuery(pool, `
                    INSERT INTO [Master].[TblRoleAuthorization] 
                    (RoleId, MenuId, IsView, IsAdd, IsEdit, IsDelete, IsActive, IsDeleted, CreatedDate)
                    VALUES 
                    (@roleId, @menuId, 1, 1, 1, 1, 1, 0, GETDATE())
                `, [{ name: 'roleId', value: roleId }, { name: 'menuId', value: m.MenuId }]);
                count++;
            } else {
                // Ensure IsView is 1 even if exists (update)
                await executeQuery(pool, `
                    UPDATE [Master].[TblRoleAuthorization]
                    SET IsView = 1, IsAdd = 1, IsEdit = 1, IsDelete = 1
                    WHERE Permissionid = @permId
                `, [{ name: 'permId', value: existing[0].Permissionid }]);
                count++; // Count updates too
            }
        }

        console.log(`Updated/Granted permissions for ${count} menus.`);
        process.exit(0);

    } catch (error) {
        console.error("Grant Failed:", error);
        process.exit(1);
    }
}

grantAll();
