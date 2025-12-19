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

async function debugMenu() {
    try {
        const pool = await sql.connect(config);
        console.log("Connected to DB...");

        const roleId = 1; // Admin

        let query = `
            SELECT 
                M.MenuId, 
                M.Menuname, 
                M.Parentid, 
                M.Icon, 
                M.Url, 
                M.Sortby,
                ISNULL(RA.IsView, 0) as HasView
            FROM [Master].[TblMenuMaster] M
            LEFT JOIN [Master].[TblRoleAuthorization_New] RA 
                ON M.MenuId = RA.MenuId AND RA.RoleId = @roleId AND RA.IsDeleted = 0
            WHERE M.IsDelete = 0 AND M.IsActive = 1
            ORDER BY M.Parentid, M.Sortby
        `;

        const menus = await executeQuery(pool, query, [{ name: 'roleId', value: roleId }]);
        console.log(`Fetched ${menus.length} rows.`);

        if (menus.length > 0) {
            console.log("Sample Row:", menus[0]);
        }

        // Logic from API
        const buildTree = (parentId) => {
            return menus
                .filter(m => (m.Parentid === parentId) || (parentId === 0 && m.Parentid == null))
                .map(m => {
                    const node = {
                        name: m.Menuname,
                        icon: m.Icon,
                        path: m.Url || '#',
                        subItems: buildTree(m.MenuId)
                    };

                    const hasVisibleChildren = node.subItems.length > 0;

                    if (m.HasView || hasVisibleChildren) {
                        return node;
                    }
                    return null;
                })
                .filter(Boolean);
        };

        const tree = buildTree(0);
        console.log("Tree Output:", JSON.stringify(tree, null, 2));

        process.exit(0);

    } catch (error) {
        console.error("Debug Failed:", error);
        process.exit(1);
    }
}

debugMenu();
