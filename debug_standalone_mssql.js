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

async function testTransaction() {
    try {
        await sql.connect(config);
        const transaction = new sql.Transaction();
        await transaction.begin();

        try {
            const req = new sql.Request(transaction);

            // Inputs mimicking the failure case
            req.input('Date', sql.Date, '2025-01-01');
            req.input('ShiftId', sql.Int, 1);
            req.input('ShiftInChargeId', sql.Int, null); // Converted from ''
            req.input('MidScaleInchargeId', sql.Int, null); // Converted from '0'
            req.input('ManPowerInShift', sql.Decimal(18, 2), 0);
            req.input('PlantId', sql.Int, 1);
            req.input('BeltScaleOHMR', sql.Decimal(18, 2), 0);
            req.input('BeltScaleCHMR', sql.Decimal(18, 2), 0);
            req.input('ProductionUnitId', sql.Int, 2);
            req.input('ProductionQty', sql.Decimal(18, 2), 0);
            req.input('EquipmentId', sql.Int, null); // Converted from '0'
            req.input('NoofTrip', sql.Int, 0);
            req.input('QtyTrip', sql.Decimal(18, 2), 0);
            req.input('TripQtyUnitId', sql.Int, 2); // 2 is valid
            req.input('TotalQty', sql.Decimal(18, 2), 0);
            req.input('OHMR', sql.Decimal(18, 2), 0);
            req.input('CHMR', sql.Decimal(18, 2), 0);
            req.input('RunningHr', sql.Decimal(18, 2), 0);
            req.input('TotalStoppageHours', sql.Decimal(18, 2), 0);
            req.input('Remarks', sql.NVarChar, '');
            req.input('UserName', sql.VarChar(50), 'TestUser');

            const query = `
                INSERT INTO [Trans].[TblCrusher] (
                    [Date], ShiftId, ShiftInChargeId, MidScaleInchargeId, ManPowerInShift, PlantId,
                    BeltScaleOHMR, BeltScaleCHMR, ProductionUnitId, ProductionQty,
                    HaulerEquipmentId, NoofTrip, QtyTrip, TripQtyUnitId,
                    TotalQty, OHMR, CHMR, RunningHr, TotalStoppageHours,
                    Remarks,
                    CreatedBy, CreatedDate, IsDelete
                )
                OUTPUT INSERTED.SlNo
                VALUES (
                    @Date, @ShiftId, @ShiftInChargeId, @MidScaleInchargeId, @ManPowerInShift, @PlantId,
                    @BeltScaleOHMR, @BeltScaleCHMR, @ProductionUnitId, @ProductionQty,
                    @EquipmentId, @NoofTrip, @QtyTrip, @TripQtyUnitId,
                    @TotalQty, @OHMR, @CHMR, @RunningHr, @TotalStoppageHours,
                    @Remarks,
                    @UserName, GETDATE(), 0
                )
            `;

            console.log("Executing query...");
            const result = await req.query(query);
            console.log("Success! SlNo:", result.recordset[0].SlNo);

            await transaction.rollback(); // Rollback so we don't spam DB
            console.log("Transaction Rolled Back.");

        } catch (innerErr) {
            console.error("Inner Error:", innerErr);
            await transaction.rollback();
        }

    } catch (err) {
        console.error("Connection/Transaction Error:", err);
    } finally {
        await sql.close();
    }
}

testTransaction();
