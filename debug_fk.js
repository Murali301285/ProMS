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

async function checkSchema() {
    try {
        await sql.connect(config);

        console.log("--- Checking Constraint ---");
        const fkResult = await sql.query`
            SELECT 
                fk.name AS ForeignKeyName,
                tp.name AS TableName,
                ref.name AS ReferencedTableName,
                c.name AS ColumnName
            FROM sys.foreign_keys AS fk
            INNER JOIN sys.tables AS tp ON fk.parent_object_id = tp.object_id
            INNER JOIN sys.tables AS ref ON fk.referenced_object_id = ref.object_id
            INNER JOIN sys.foreign_key_columns AS fkc ON fk.object_id = fkc.constraint_object_id
            INNER JOIN sys.columns AS c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
            WHERE tp.name = 'TblCrusher'
        `;
        console.table(fkResult.recordset);

        console.log("\n--- Checking TblUser_New ---");
        try {
            const userNewResult = await sql.query`SELECT TOP 5 SlNo, UserName FROM [Master].[TblUser_New]`;
            console.table(userNewResult.recordset);
        } catch (e) {
            console.log("TblUser_New error/not found:", e.message);
        }

        console.log("\n--- Checking TblUser ---");
        try {
            const userResult = await sql.query`SELECT TOP 5 SlNo, UserName FROM [Master].[TblUser]`;
            console.table(userResult.recordset);
        } catch (e) {
            console.log("TblUser error/not found:", e.message);
        }

        await sql.close();
    } catch (err) {
        console.error("Error:", err);
    }
}

checkSchema();
