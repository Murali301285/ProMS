const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        await sql.connect(config);

        console.log("--- Executing Menu Tree Query for RoleId = 1 ---");
        const query = `
            SELECT 
                MA.ModuleId,
                MA.SubGroupId,
                P.SlNo as PageId,
                P.PageName,
                P.PagePath as Url,
                MA.SortOrder
            FROM [Master].[TblMenuAllocation] MA
            INNER JOIN [Master].[TblPage] P ON MA.PageId = P.SlNo
            INNER JOIN [Master].[TblRoleAuthorization_New] RA ON RA.PageId = P.SlNo
            WHERE 
                MA.IsActive = 1 AND MA.IsDelete = 0
                AND P.IsActive = 1 AND P.IsDelete = 0
                AND RA.RoleId = 1 AND RA.IsView = 1
                AND RA.IsActive = 1 AND RA.IsDeleted = 0 -- Note: IsDeleted column name check
            ORDER BY MA.SortOrder
        `;

        // Note: I am using 'IsDeleted' based on previous checks, but menu-tree might be using 'IsDelete'.
        // Let's check the file content of menu-tree again if this fails.

        const result = await sql.query(query);
        const reports = result.recordset.filter(r => r.PageName.includes('Report') || r.Url.includes('report'));

        console.table(reports);

        if (reports.length === 0) {
            console.log("No reports found in query. Checking individual tables...");

            const page = await sql.query("SELECT * FROM [Master].TblPage WHERE PagePath = '/dashboard/reports'");
            console.log("Page:", page.recordset[0]);

            if (page.recordset.length > 0) {
                const pageId = page.recordset[0].SlNo;

                const allocation = await sql.query(`SELECT * FROM [Master].TblMenuAllocation WHERE PageId = ${pageId}`);
                console.log("Allocation:", allocation.recordset);

                const auth = await sql.query(`SELECT * FROM [Master].TblRoleAuthorization_New WHERE PageId = ${pageId} AND RoleId = 1`);
                console.log("Authorization:", auth.recordset);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

run();
