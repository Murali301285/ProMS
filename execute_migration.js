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
    },
};

async function migrate() {
    try {
        await sql.connect(config);
        console.log("Connected...");

        // 1. Add Columns
        console.log("Adding temporary INT columns...");
        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Transaction].[TblWaterTankerEntry]') AND name = 'CreatedBy_Int')
            BEGIN
                ALTER TABLE [Transaction].[TblWaterTankerEntry] ADD CreatedBy_Int INT NULL;
            END
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('[Transaction].[TblWaterTankerEntry]') AND name = 'UpdatedBy_Int')
            BEGIN
                ALTER TABLE [Transaction].[TblWaterTankerEntry] ADD UpdatedBy_Int INT NULL;
            END
        `);

        // 2. Update Data
        console.log("Updating data from TblUser_New...");
        // Match by UserName
        await sql.query(`
            UPDATE T
            SET T.CreatedBy_Int = U.SlNo
            FROM [Transaction].[TblWaterTankerEntry] T
            JOIN [Master].[TblUser_New] U ON T.CreatedBy = U.UserName
        `);

        await sql.query(`
            UPDATE T
            SET T.UpdatedBy_Int = U.SlNo
            FROM [Transaction].[TblWaterTankerEntry] T
            JOIN [Master].[TblUser_New] U ON T.UpdatedBy = U.UserName
        `);

        // Handle Unmatched? Default to 1 (Admin) or Keep NULL if allowed
        // Let's assume most matched. Use 1 as fallback for CreatedBy if NULL?
        // Let's check if any are null first
        const checkNulls = await sql.query(`SELECT COUNT(*) as Cnt FROM [Transaction].[TblWaterTankerEntry] WHERE CreatedBy_Int IS NULL`);
        if (checkNulls.recordset[0].Cnt > 0) {
            console.log(`Warning: ${checkNulls.recordset[0].Cnt} records did not match a user. Setting to ID 1 (Admin fallback)...`);
            await sql.query(`UPDATE [Transaction].[TblWaterTankerEntry] SET CreatedBy_Int = 1 WHERE CreatedBy_Int IS NULL`);
        }

        // 3. Drop Old Columns
        console.log("Dropping old varchar columns...");
        // Drop constraints if any? (Default constraints might exist)
        // Usually CreatedBy doesn't have constraints unless defaults.
        await sql.query(`ALTER TABLE [Transaction].[TblWaterTankerEntry] DROP COLUMN CreatedBy`);
        await sql.query(`ALTER TABLE [Transaction].[TblWaterTankerEntry] DROP COLUMN UpdatedBy`);

        // 4. Rename Columns
        console.log("Renaming columns...");
        await sql.query(`EXEC sp_rename '[Transaction].[TblWaterTankerEntry].CreatedBy_Int', 'CreatedBy', 'COLUMN'`);
        await sql.query(`EXEC sp_rename '[Transaction].[TblWaterTankerEntry].UpdatedBy_Int', 'UpdatedBy', 'COLUMN'`);

        // 5. Add FK
        console.log("Adding Foreign Keys...");
        await sql.query(`
            ALTER TABLE [Transaction].[TblWaterTankerEntry] 
            WITH CHECK ADD CONSTRAINT [FK_TblWaterTankerEntry_CreatedBy] FOREIGN KEY([CreatedBy])
            REFERENCES [Master].[TblUser_New] ([SlNo])
        `);

        await sql.query(`
            ALTER TABLE [Transaction].[TblWaterTankerEntry] 
            WITH CHECK ADD CONSTRAINT [FK_TblWaterTankerEntry_UpdatedBy] FOREIGN KEY([UpdatedBy])
            REFERENCES [Master].[TblUser_New] ([SlNo])
        `);

        console.log("Migration Complete.");

    } catch (err) {
        console.error("Migration Failed:", err);
    } finally {
        await sql.close();
    }
}

migrate();
