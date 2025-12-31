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

async function runMigration() {
    try {
        console.log("Connecting to Database...");
        let pool = await sql.connect(config);
        console.log("Connected.");

        const query = `
            -- Migration to convert User columns to INT and add Foreign Keys for TblElectricalEntry

            BEGIN TRANSACTION;

            BEGIN TRY
                -- 1. Alter CreatedBy to INT
                ALTER TABLE [Trans].[TblElectricalEntry] ALTER COLUMN [CreatedBy] INT NULL;
                PRINT 'Altered CreatedBy to INT';

                -- 2. Alter UpdatedBy to INT
                ALTER TABLE [Trans].[TblElectricalEntry] ALTER COLUMN [UpdatedBy] INT NULL;
                PRINT 'Altered UpdatedBy to INT';

                -- 3. Add Foreign Key for CreatedBy
                IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[Trans].[FK_TblElectricalEntry_CreatedBy]') AND parent_object_id = OBJECT_ID(N'[Trans].[TblElectricalEntry]'))
                BEGIN
                    ALTER TABLE [Trans].[TblElectricalEntry] WITH CHECK ADD CONSTRAINT [FK_TblElectricalEntry_CreatedBy] FOREIGN KEY([CreatedBy])
                    REFERENCES [Master].[TblUser_New] ([SlNo]);
                    
                    ALTER TABLE [Trans].[TblElectricalEntry] CHECK CONSTRAINT [FK_TblElectricalEntry_CreatedBy];
                    PRINT 'Added FK_TblElectricalEntry_CreatedBy';
                END

                -- 4. Add Foreign Key for UpdatedBy
                IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[Trans].[FK_TblElectricalEntry_UpdatedBy]') AND parent_object_id = OBJECT_ID(N'[Trans].[TblElectricalEntry]'))
                BEGIN
                    ALTER TABLE [Trans].[TblElectricalEntry] WITH CHECK ADD CONSTRAINT [FK_TblElectricalEntry_UpdatedBy] FOREIGN KEY([UpdatedBy])
                    REFERENCES [Master].[TblUser_New] ([SlNo]);
                    
                    ALTER TABLE [Trans].[TblElectricalEntry] CHECK CONSTRAINT [FK_TblElectricalEntry_UpdatedBy];
                    PRINT 'Added FK_TblElectricalEntry_UpdatedBy';
                END

                COMMIT TRANSACTION;
                PRINT 'Migration Successful';

            END TRY
            BEGIN CATCH
                ROLLBACK TRANSACTION;
                PRINT 'Migration Failed';
                PRINT ERROR_MESSAGE();
            END CATCH;
        `;

        console.log("Executing Migration...");
        const result = await pool.request().query(query);
        console.log("Result:", result); // Output might be in messages

        pool.close();
        console.log("Done.");

    } catch (err) {
        console.error("Migration Error:", err);
    }
}

runMigration();
