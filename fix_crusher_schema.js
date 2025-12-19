
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

async function migrate() {
    try {
        await sql.connect(config);

        const columnsToAdd = [
            { name: 'ShiftInChargeId', type: 'INT' },
            { name: 'ManPowerInShift', type: 'DECIMAL(18, 2)' }, // Or INT
            { name: 'PlantId', type: 'INT' },
            { name: 'BeltScaleOHMR', type: 'DECIMAL(18, 2)' },
            { name: 'BeltScaleCHMR', type: 'DECIMAL(18, 2)' },
            { name: 'ProductionUnitId', type: 'INT' },
            { name: 'ProductionQty', type: 'DECIMAL(18, 2)' },
            { name: 'HaulerId', type: 'INT' },
            { name: 'NoofTrip', type: 'INT' },
            { name: 'QtyTrip', type: 'DECIMAL(18, 2)' },
            { name: 'TripQtyUnitId', type: 'INT' },
            { name: 'TotalQty', type: 'DECIMAL(18, 2)' },
            { name: 'OHMR', type: 'DECIMAL(18, 2)' },
            { name: 'CHMR', type: 'DECIMAL(18, 2)' },
            { name: 'RunningHr', type: 'DECIMAL(18, 2)' },
            { name: 'TotalStoppageHours', type: 'DECIMAL(18, 2)' }
        ];

        for (const col of columnsToAdd) {
            const query = `
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[Trans].[TblCrusher]') AND name = '${col.name}')
                BEGIN
                    ALTER TABLE [Trans].[TblCrusher] ADD ${col.name} ${col.type};
                    PRINT 'Added ${col.name}';
                END
                ELSE
                BEGIN
                    PRINT 'Column ${col.name} already exists';
                END
            `;
            await sql.query(query);
            console.log(`Checked/Added ${col.name}`);
        }

    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        await sql.close();
    }
}

migrate();
