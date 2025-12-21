CREATE OR ALTER PROCEDURE [dbo].[ProMS2_SPReportTentativeProduction]
    @Date DATE,
    @ShiftId INT
AS
BEGIN
            DECLARE @OBId int=2,@TopSoilId int=1,@RomCoalId int=7,@ObRehandlingId int=5,@DestinationDumpB int=2,@DestinationCarpetingWorkId int=10;

            -- 1. Waste Handling
            WITH WasteHandlingTable As( 
                select T1.EquipmentGroupId,T2.Name as EquipmentGroup,T3.Name as Scale,T0.MaterialId,SUM(T0.NoofTrip) AS NoofTrip,T0.QtyTrip
                from Trans.TblLoading T0
                Join Master.TblEquipment T1 on T1.SlNo=T0.HaulerEquipmentId
                Join Master.TblEquipmentGroup T2 on T2.SlNo=T1.EquipmentGroupId
                Join Master.TblScale T3 on T3.SlNo=T1.ScaleId
                Where T0.IsDelete =0 AND T0.MaterialId in (@TopSoilId,@OBId) and T0.DestinationId!=@DestinationCarpetingWorkId and Convert(date,T0.LoadingDate)=@Date and T0.ShiftId=@ShiftId
                group by T1.EquipmentGroupId,T2.Name,T3.Name,T0.MaterialId,T0.QtyTrip
            )
            select T0.EquipmentGroupId,T0.EquipmentGroup,T0.Scale,
            ISNULL(T1.OverBurden,0) as OverBurden,ISNULL(T1.OverBurdenFactor,0) as OverBurdenFactor,
            ISNULL(T2.TopSoil,0) AS TopSoil ,ISNULL(T2.TopSoilFactor,0) AS TopSoilFactor,
            ISNULL(T1.OverBurden,0)+ISNULL(T2.TopSoil,0) as TotalTrip, (ISNULL(T1.OverBurden,0)*ISNULL(T1.OverBurdenFactor,0))+(ISNULL(T2.TopSoil,0)*ISNULL(T2.TopSoilFactor,0)) as QtyBcm,
            0 as MapioTrip,0 as MapioQty,(0-ISNULL(T1.OverBurden,0)+ISNULL(T2.TopSoil,0)) as Diff
            from WasteHandlingTable T0
            Outer apply (select SUM(NoofTrip) as OverBurden,QtyTrip as OverBurdenFactor from WasteHandlingTable where MaterialId=@OBId and EquipmentGroupId=T0.EquipmentGroupId group by QtyTrip) T1
            Outer apply (select SUM(NoofTrip) as TopSoil,QtyTrip as TopSoilFactor from WasteHandlingTable where MaterialId=@TopSoilId and EquipmentGroupId=T0.EquipmentGroupId group by QtyTrip) T2
            group by T0.EquipmentGroupId,T0.EquipmentGroup,T0.Scale,T1.OverBurden,T1.OverBurdenFactor,T2.TopSoil,T2.TopSoilFactor;

            -- 2. Coal Production
            select *,Convert(decimal(18,2), A.RomCoal*A.Factor) as Qty,0 as MapioTrip,0 as MapioQty,(0-(Convert(decimal(18,2), A.RomCoal*A.Factor))) as Diff  from (
            select  T1.EquipmentGroupId,T2.Name as EquipmentGroup,T0.MaterialId,SUM(T0.NoofTrip) AS RomCoal,T0.QtyTrip as Factor
            from Trans.TblLoading T0
            Join Master.TblEquipment T1 on T1.SlNo=T0.HaulerEquipmentId
            Join Master.TblEquipmentGroup T2 on T2.SlNo=T1.EquipmentGroupId
            Where T0.IsDelete=0 and T0.MaterialId in (@RomCoalId) and Convert(date,T0.LoadingDate)=@Date and T0.ShiftId=@ShiftId
            group by T1.EquipmentGroupId,T2.Name,T0.MaterialId,T0.QtyTrip) A;

            -- 3. WP-3 Quantity
            WITH WP3Table As( select  T1.EquipmentGroupId,T2.Name as EquipmentGroup,T3.Name as Scale,T0.MaterialId,SUM(T0.NoofTrip) AS NoofTrip,T0.QtyTrip
                from Trans.TblLoading T0
                Join Master.TblEquipment T1 on T1.SlNo=T0.HaulerEquipmentId
                Join Master.TblEquipmentGroup T2 on T2.SlNo=T1.EquipmentGroupId
                Join Master.TblScale T3 on T3.SlNo=T1.ScaleId
                Where T0.MaterialId in (@TopSoilId,@OBId) and T0.DestinationId=@DestinationDumpB and Convert(date,T0.LoadingDate)=@Date and T0.ShiftId=@ShiftId
                group by T1.EquipmentGroupId,T2.Name,T3.Name,T0.MaterialId,T0.QtyTrip
            )
            select T0.EquipmentGroupId,T0.EquipmentGroup,T0.Scale,
            ISNULL(T1.OverBurden,0) as OverBurden,ISNULL(T1.OverBurdenFactor,0) as OverBurdenFactor,
            ISNULL(T2.TopSoil,0) AS TopSoil ,ISNULL(T2.TopSoilFactor,0) AS TopSoilFactor,
            ISNULL(T1.OverBurden,0)+ISNULL(T2.TopSoil,0) as TotalTrip, (ISNULL(T1.OverBurden,0)*ISNULL(T1.OverBurdenFactor,0))+(ISNULL(T2.TopSoil,0)*ISNULL(T2.TopSoilFactor,0)) as QtyBcm
            from WP3Table T0
            Outer apply (select SUM(NoofTrip) as OverBurden,QtyTrip as OverBurdenFactor from WP3Table where MaterialId=@OBId and EquipmentGroupId=T0.EquipmentGroupId group by QtyTrip) T1
            Outer apply (select SUM(NoofTrip) as TopSoil,QtyTrip as TopSoilFactor from WP3Table where MaterialId=@TopSoilId and EquipmentGroupId=T0.EquipmentGroupId group by QtyTrip) T2
            group by T0.EquipmentGroupId,T0.EquipmentGroup,T0.Scale,T1.OverBurden,T1.OverBurdenFactor,T2.TopSoil,T2.TopSoilFactor;

            -- 4. OB Rehandling/Carpeting Quantity
            select A.EquipmentGroupId,A.EquipmentGroup,SUM(A.Trip) as Trip,A.Factor,Convert(decimal(18,2),SUM(A.Trip*A.Factor)) as Qty from (
            select  T1.EquipmentGroupId,T2.Name as EquipmentGroup,SUM(T0.NoofTrip) AS Trip,T0.QtyTrip as Factor
            from Trans.TblMaterialRehandling T0
            Join Master.TblEquipment T1 on T1.SlNo=T0.HaulerEquipmentId
            Join Master.TblEquipmentGroup T2 on T2.SlNo=T1.EquipmentGroupId
            Where T0.IsDelete=0 and T0.MaterialId in (@ObRehandlingId) and Convert(date,T0.RehandlingDate)=@Date and T0.ShiftId=@ShiftId
            group by T1.EquipmentGroupId,T2.Name,T0.QtyTrip
            Union all
            select  T1.EquipmentGroupId,T2.Name as EquipmentGroup,SUM(T0.NoofTrip) AS Trip,T0.QtyTrip as Factor
            from Trans.TblLoading T0
            Join Master.TblEquipment T1 on T1.SlNo=T0.HaulerEquipmentId
            Join Master.TblEquipmentGroup T2 on T2.SlNo=T1.EquipmentGroupId
            Where T0.DestinationId=@DestinationCarpetingWorkId and Convert(date,T0.LoadingDate)=@Date and T0.ShiftId=@ShiftId
            group by T1.EquipmentGroupId,T2.Name,T0.QtyTrip
            ) A group by A.EquipmentGroupId,A.EquipmentGroup,A.Factor;

            -- 5. Coal Rehandling Quantity
            select *,Convert(decimal(18,2),A.Trip*A.Factor) as Qty from (
            select  T1.EquipmentGroupId,T2.Name as EquipmentGroup,T0.MaterialId,SUM(T0.NoofTrip) AS Trip,T0.QtyTrip as Factor
            from Trans.TblMaterialRehandling T0
            Join Master.TblEquipment T1 on T1.SlNo=T0.HaulerEquipmentId
            Join Master.TblEquipmentGroup T2 on T2.SlNo=T1.EquipmentGroupId
            Where T0.IsDelete=0 and T0.MaterialId in (@RomCoalId) and Convert(date,T0.RehandlingDate)=@Date and T0.ShiftId=@ShiftId
            group by T1.EquipmentGroupId,T2.Name,T0.MaterialId,T0.QtyTrip) A;
                
            -- 6. FilterData	
            WITH FilterDate AS(
                select T2.OperatorName as ShiftIncharge,RE.Name as Relay from Trans.TblLoading T0 join Trans.TblLoadingShiftIncharge T1 on T1.LoadingId=T0.SlNo join Master.TblOperator T2 on T2.SlNo=T1.OperatorId JOIN Master.TblRelay RE on RE.SlNo=T0.RelayId where T0.IsDelete=0 and T0.MaterialId in (@OBId,@TopSoilId,@RomCoalId) and Convert(date,T0.LoadingDate)=@Date and T0.ShiftId=@ShiftId
                Union
                select T2.OperatorName as ShiftIncharge ,RE.Name as Relay from Trans.TblLoading T0 join Trans.TblLoadingShiftIncharge T1 on T1.LoadingId=T0.SlNo join Master.TblOperator T2 on T2.SlNo=T1.OperatorId JOIN Master.TblRelay RE on RE.SlNo=T0.RelayId where T0.IsDelete=0 and T0.MaterialId in (@OBId,@TopSoilId) and T0.DestinationId=@DestinationDumpB and Convert(date,T0.LoadingDate)=@Date and T0.ShiftId=@ShiftId
                Union
                select T2.OperatorName as ShiftIncharge,RE.Name as Relay from Trans.TblMaterialRehandling T0 join Trans.TblMaterialRehandlingShiftIncharge T1 on T1.MaterialRehandlingId=T0.SlNo join Master.TblOperator T2 on T2.SlNo=T1.OperatorId JOIN Master.TblRelay RE on RE.SlNo=T0.RelayId where T0.IsDelete=0 and T0.MaterialId in (@ObRehandlingId,@RomCoalId) and Convert(date,T0.RehandlingDate)=@Date and T0.ShiftId=@ShiftId
            )

            Select (SELECT STRING_AGG(ShiftIncharge, ', ') FROM (SELECT DISTINCT ShiftIncharge FROM FilterDate) AS SI) AS ShiftIncharge,
            (SELECT STRING_AGG(Relay, ', ') FROM (SELECT DISTINCT Relay FROM FilterDate) AS RE) AS Relay,
            (Select TOP 1 ShiftName from Master.TblShift where SlNo=@ShiftId) as ShiftName,FORMAT(@Date,'dd-MMM-yyyy') as Date,'' as Logo
END
