const { executeQuery } = require('./lib/db');

async function addRemarks() {
    try {
        console.log("Adding Remarks to TblMaterialRehandling...");
        const query = `
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblMaterialRehandling' AND COLUMN_NAME = 'Remarks')
            BEGIN
                ALTER TABLE [Trans].[TblMaterialRehandling] ADD Remarks NVARCHAR(MAX);
                PRINT 'Remarks column added successfully.';
            END
            ELSE
            BEGIN
                PRINT 'Remarks column already exists.';
            END
        `;
        await executeQuery(query);
    } catch (e) {
        console.error("Error adding Remarks:", e);
    }
}

addRemarks();
