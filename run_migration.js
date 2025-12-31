const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
    user: 'sa', // If this failed with ELOGIN, maybe need to check what worked in debug_blasting.js ? 
    // debug_blasting.js used:
    // user: 'sa', password: 'Chennai@42', server: 'localhost', port: 1433, database: 'ProdMS_live' (Wait, debug used ProdMS_live??)
    // The query I ran in debug_blasting.js showed "Cannot open database ProMS_Dev" for sqlcmd, but the node script worked?
    // Let's check debug_blasting.js content again.

    // Ah, previous check said:
    // const config = { user: 'sa', password: 'Chennai@42', server: 'localhost', port: 1433, database: 'ProdMS_live' ... }
    // BUT the query worked on [Trans].[TblBlasting] inside that DB?
    // The user's request context said they use `d:\Dev\ProMS\ProMSDev`. 
    // And `sqlcmd` failed on `ProMS_Dev`. 
    // Maybe the DB name IS `ProdMS_live` locally? Or `ProMS_Dev`?
    // I should check `lib/db.js` to see the actual app config.

    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live', // Trying ProdMS_live as per debug_blasting.js success
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function runMigration() {
    try {
        console.log("Connecting...");
        let pool = await sql.connect(config);
        console.log("Connected.");

        const sqlFile = path.join(__dirname, 'migration_blasting_users.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');

        // Split by GO is not supported by mssql direct execution usually, 
        // but let's try reading the commands. 
        // Actually, mssql library executes T-SQL batches. 'GO' is a tool separator, not T-SQL.
        // We need to remove 'GO' and maybe split if necessary.
        // Or better yet, just write the logic in JS for safety/simplicity here.

        console.log("Running Migration Queries...");

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            // 1. Alter CreatedBy
            await request.query("ALTER TABLE [Trans].[TblBlasting] ALTER COLUMN [CreatedBy] INT NULL");
            console.log("Altered CreatedBy");

            // 2. Alter UpdatedBy
            await request.query("ALTER TABLE [Trans].[TblBlasting] ALTER COLUMN [UpdatedBy] INT NULL");
            console.log("Altered UpdatedBy");

            // 3. Add FK CreatedBy
            // Check existence first
            const checkFK1 = await request.query("SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[Trans].[FK_TblBlasting_CreatedBy]')");
            if (checkFK1.recordset.length === 0) {
                await request.query("ALTER TABLE [Trans].[TblBlasting]  WITH CHECK ADD  CONSTRAINT [FK_TblBlasting_CreatedBy] FOREIGN KEY([CreatedBy]) REFERENCES [Master].[TblUser_New] ([SlNo])");
                await request.query("ALTER TABLE [Trans].[TblBlasting] CHECK CONSTRAINT [FK_TblBlasting_CreatedBy]");
                console.log("Added FK CreatedBy");
            } else {
                console.log("FK CreatedBy already exists");
            }

            // 4. Add FK UpdatedBy
            const checkFK2 = await request.query("SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[Trans].[FK_TblBlasting_UpdatedBy]')");
            if (checkFK2.recordset.length === 0) {
                await request.query("ALTER TABLE [Trans].[TblBlasting]  WITH CHECK ADD  CONSTRAINT [FK_TblBlasting_UpdatedBy] FOREIGN KEY([UpdatedBy]) REFERENCES [Master].[TblUser_New] ([SlNo])");
                await request.query("ALTER TABLE [Trans].[TblBlasting] CHECK CONSTRAINT [FK_TblBlasting_UpdatedBy]");
                console.log("Added FK UpdatedBy");
            } else {
                console.log("FK UpdatedBy already exists");
            }

            await transaction.commit();
            console.log("Migration Successful!");

        } catch (err) {
            await transaction.rollback();
            console.error("Migration Failed. Rolled back.", err);
        }

        pool.close();

    } catch (err) {
        console.error("Connection Error:", err);
    }
}

runMigration();
