
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

async function addEquipmentId() {
    try {
        await sql.connect(config);

        const query = `
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Trans].[TblCrusher]') AND name = 'EquipmentId')
            BEGIN
                ALTER TABLE [Trans].[TblCrusher] ADD EquipmentId INT NULL;
                PRINT 'Added EquipmentId column';
            END
            ELSE
            BEGIN
                PRINT 'Column EquipmentId already exists';
            END
            
            -- Optional: If we want to move data from HaulerId (if any exists) to EquipmentId
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Trans].[TblCrusher]') AND name = 'HaulerId')
            BEGIN
                PRINT 'Syncing HaulerId data to EquipmentId...';
                UPDATE [Trans].[TblCrusher] SET EquipmentId = HaulerId WHERE EquipmentId IS NULL;
            END
        `;

        await sql.query(query);
        console.log("Migration executed successfully.");

    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        await sql.close();
    }
}

addEquipmentId();
