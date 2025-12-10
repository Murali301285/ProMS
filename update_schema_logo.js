const { getDbConnection, sql } = require('./lib/db.js');

async function updateSchema() {
    try {
        const pool = await getDbConnection();
        console.log('Adding Logo column to TblCompany...');

        // check if column exists
        const check = `
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[Master].[TblCompany]') 
                AND name = 'Logo'
            )
            BEGIN
                ALTER TABLE [Master].[TblCompany] ADD Logo NVARCHAR(MAX) NULL;
            END
        `;

        await pool.request().query(check);
        console.log('Schema updated successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Schema Update Failed:', err);
        process.exit(1);
    }
}

updateSchema();
