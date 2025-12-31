DECLARE @SlNo INT;

BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO [Trans].[TblCrusher] (
        [Date], ShiftId, ShiftInChargeId, MidScaleInchargeId, ManPowerInShift, PlantId,
        BeltScaleOHMR, BeltScaleCHMR, ProductionUnitId, ProductionQty,
        HaulerEquipmentId, NoofTrip, QtyTrip, TripQtyUnitId,
        TotalQty, OHMR, CHMR, RunningHr, TotalStoppageHours,
        Remarks,
        CreatedBy, CreatedDate, IsDelete
    )
    VALUES (
        GETDATE(), 1, 1, NULL, 5, 1,
        100, 200, 2, 100,
        1, 10, 10, 2,
        100, 50, 60, 10, 0,
        'Test Insert',
        1, GETDATE(), 0
    );

    SET @SlNo = SCOPE_IDENTITY();
    PRINT 'Inserted SlNo: ' + CAST(@SlNo AS VARCHAR);

    ROLLBACK TRANSACTION; -- Don't actually save it
    PRINT 'Transaction Rolled Back (Success)';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error Line: ' + CAST(ERROR_LINE() AS VARCHAR);
    PRINT 'Error Message: ' + ERROR_MESSAGE();
END CATCH
