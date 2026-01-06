const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function addRemarks() {
    try {
        await sql.connect(config);
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
        const result = await sql.query(query);
        console.log("Result:", result);
    } catch (e) {
        console.error("Error adding Remarks:", e);
    } finally {
        await sql.close();
    }
}

addRemarks();
