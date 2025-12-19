
const { executeQuery } = require('./lib/db');

async function test() {
    try {
        console.log("Checking Menus...");
        const menus = await executeQuery("SELECT Count(*) as count FROM [Master].[TblMenuMaster]");
        console.log("Total Menus:", menus[0].count);

        const parents = await executeQuery("SELECT * FROM [Master].[TblMenuMaster] WHERE IsNull(Parentid, 0) = 0");
        console.log("Root Menus (Parent=0/Null):", parents.length);
        parents.forEach(p => console.log(` - ${p.Menuname} (ID: ${p.MenuId})`));

        console.log("\nChecking Admin Authorization...");
        // Check for roleId 1 (assuming Admin is 1)
        const auth = await executeQuery("SELECT Count(*) as count FROM [Master].[TblRoleAuthorization_New] WHERE RoleId = 1");
        console.log("Admin Permissions Count:", auth[0].count);

    } catch (e) {
        console.error(e);
    }
}
test();
