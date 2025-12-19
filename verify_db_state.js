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

async function run() {
    try {
        const pool = await sql.connect(config);

        // 1. Check Row Counts
        const countMenu = await pool.request().query("SELECT COUNT(*) as c FROM [Master].[TblMenuMaster]");
        console.log('MenuMaster Count:', countMenu.recordset[0].c);

        const countAuth = await pool.request().query("SELECT COUNT(*) as c FROM [Master].[TblRoleAuthorization]");
        console.log('RoleAuthorization Count:', countAuth.recordset[0].c);

        // 2. Check FKs
        const fks = await pool.request().query(`
            SELECT 
                fk.name, 
                OBJECT_NAME(fk.parent_object_id) 'ParentTable', 
                c1.name 'ParentColumn', 
                OBJECT_NAME(fk.referenced_object_id) 'ReferencedTable', 
                c2.name 'ReferencedColumn' 
            FROM sys.foreign_keys fk
            INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
            INNER JOIN sys.columns c1 ON fkc.parent_column_id = c1.column_id AND fkc.parent_object_id = c1.object_id
            INNER JOIN sys.columns c2 ON fkc.referenced_column_id = c2.column_id AND fkc.referenced_object_id = c2.object_id
            WHERE OBJECT_NAME(fk.referenced_object_id) = 'TblMenuMaster'
        `);
        console.log('Foreign Keys referencing TblMenuMaster:', fks.recordset);

        process.exit(0);
    } catch (err) {
        console.error('SQL Error:', err);
        process.exit(1);
    }
}

run();
