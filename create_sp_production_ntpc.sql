CREATE OR ALTER PROCEDURE [dbo].[SPReportProductionNTPC] 
    @Date DATE = NULL,
    @ShiftId int = NULL
AS
BEGIN
        Declare @OBId int=2,@TopSoilId int=1,@RomCoalId int=7,@ObRehandlingId int=5,@DestinationDumpB int=2;
		Declare @ProdCoal decimal(18,2)=0,@ProdOB decimal(18,2)=0,@WPCoalQty decimal(18,2)=0,@WPObQty decimal(18,2)=0;
		--Production Quantity
        select @ProdCoal=Convert(decimal(18,2), ISNULL(SUM(A.RomCoal),0.00)) from (
		select  T1.EquipmentGroupId,T2.Name as EquipmentGroup,T0.MaterialId,SUM(T0.NoofTrip*T0.NtpcQtyTrip) AS RomCoal
		from Trans.TblLoading T0
		Join Master.TblEquipment T1 on T1.SlNo=T0.HaulerEquipmentId
		Join Master.TblEquipmentGroup T2 on T2.SlNo=T1.EquipmentGroupId
		Where T0.IsDelete=0 and T0.MaterialId in (@RomCoalId) and Convert(date,T0.LoadingDate)=@Date and T0.ShiftId=@ShiftId
		group by T1.EquipmentGroupId,T2.Name,T0.MaterialId) A;

		WITH WasteHandlingTable As( select  T1.EquipmentGroupId,T2.Name as EquipmentGroup,T3.Name as Scale,T0.MaterialId,SUM(T0.NoofTrip) AS NoofTrip,T0.NtpcQtyTrip
		from Trans.TblLoading T0
		Join Master.TblEquipment T1 on T1.SlNo=T0.HaulerEquipmentId
		Join Master.TblEquipmentGroup T2 on T2.SlNo=T1.EquipmentGroupId
		Join Master.TblScale T3 on T3.SlNo=T1.ScaleId
		Where T0.IsDelete=0 and T0.MaterialId in (@TopSoilId,@OBId) and Convert(date,T0.LoadingDate)=@Date and T0.ShiftId=@ShiftId
		group by T1.EquipmentGroupId,T2.Name,T3.Name,T0.MaterialId,T0.NtpcQtyTrip
		)
		Select @ProdOB=Convert(decimal(18,2),ISNULL(SUM(A.QtyBcm),0.00)) from (
		select T0.EquipmentGroupId,T0.EquipmentGroup,T0.Scale,
		(ISNULL(T1.OverBurden,0)+ISNULL(T2.TopSoil,0)) as QtyBcm
		from WasteHandlingTable T0
		Outer apply (select SUM(NoofTrip*NtpcQtyTrip) as OverBurden from WasteHandlingTable where MaterialId=@OBId and EquipmentGroupId=T0.EquipmentGroupId) T1
		Outer apply (select SUM(NoofTrip*NtpcQtyTrip) as TopSoil from WasteHandlingTable where MaterialId=@TopSoilId and EquipmentGroupId=T0.EquipmentGroupId) T2
		group by T0.EquipmentGroupId,T0.EquipmentGroup,T0.Scale,T1.OverBurden,T2.TopSoil
		)  A;

		--WP-3 Quantity
		WITH WP3Table As( select  T1.EquipmentGroupId,T2.Name as EquipmentGroup,T3.Name as Scale,T0.MaterialId,SUM(T0.NoofTrip) AS NoofTrip,T0.NtpcQtyTrip
			from Trans.TblLoading T0
			Join Master.TblEquipment T1 on T1.SlNo=T0.HaulerEquipmentId
			Join Master.TblEquipmentGroup T2 on T2.SlNo=T1.EquipmentGroupId
			Join Master.TblScale T3 on T3.SlNo=T1.ScaleId
			Where T0.IsDelete=0 and T0.MaterialId in (@TopSoilId,@OBId,@RomCoalId) and T0.DestinationId=@DestinationDumpB and Convert(date,T0.LoadingDate)=@Date and T0.ShiftId=@ShiftId
			group by T1.EquipmentGroupId,T2.Name,T3.Name,T0.MaterialId,T0.NtpcQtyTrip
		)
		Select @WPCoalQty=Convert(decimal(18,2),ISNULL(SUM(A.WPCoalQty),0.00)),@WPObQty=Convert(decimal(18,2),ISNULL(SUM(A.WPObQty),0.00)) from (
		select T0.EquipmentGroupId,T0.EquipmentGroup,T0.Scale,
		(ISNULL(T1.OverBurden,0)+ISNULL(T2.TopSoil,0)) as WPObQty,ISNULL(T3.Coal,0) as WPCoalQty
		from WP3Table T0
		Outer apply (select SUM(NoofTrip*NtpcQtyTrip) as OverBurden from WP3Table where MaterialId=@OBId and EquipmentGroupId=T0.EquipmentGroupId) T1
		Outer apply (select SUM(NoofTrip*NtpcQtyTrip) as TopSoil from WP3Table where MaterialId=@TopSoilId and EquipmentGroupId=T0.EquipmentGroupId) T2
		Outer apply (select SUM(NoofTrip*NtpcQtyTrip) as Coal from WP3Table where MaterialId=@RomCoalId and EquipmentGroupId=T0.EquipmentGroupId) T3
		group by T0.EquipmentGroupId,T0.EquipmentGroup,T0.Scale,T1.OverBurden,T2.TopSoil,T3.Coal ) A;

		select @ProdCoal as ProdCoal,@ProdOB as ProdOB,@WPCoalQty as WPCoalQty,@WPObQty as WPObQty


		--Crusher Details
		select  T1.Name as Plant,SUM(T0.RunningHr) as RunningHr,SUM(T0.ProductionQty) as TotalQty 
		from Trans.TblCrusher T0
		JOIN Master.TblPlant T1 on T1.SlNo=T0.PlantId
		where T0.IsDelete=0 
		and Convert(date,T0.Date)=@Date and T0.ShiftId=@ShiftId
		Group by T1.Name;

		--FilterData	
		WITH FilterDate AS(
		    select T2.OperatorName as ShiftIncharge,RE.Name as Relay from Trans.TblLoading T0 join Trans.TblLoadingShiftIncharge T1 on T1.LoadingId=T0.SlNo join Master.TblOperator T2 on T2.SlNo=T1.OperatorId JOIN Master.TblRelay RE on RE.SlNo=T0.RelayId where T0.IsDelete=0 and T0.MaterialId in (@OBId,@TopSoilId,@RomCoalId) and Convert(date,T0.LoadingDate)=@Date and T0.ShiftId=@ShiftId
			Union
			select T2.OperatorName as ShiftIncharge ,RE.Name as Relay from Trans.TblLoading T0 join Trans.TblLoadingShiftIncharge T1 on T1.LoadingId=T0.SlNo join Master.TblOperator T2 on T2.SlNo=T1.OperatorId JOIN Master.TblRelay RE on RE.SlNo=T0.RelayId where T0.IsDelete=0 and T0.MaterialId in (@OBId,@TopSoilId,@RomCoalId) and T0.DestinationId=@DestinationDumpB and Convert(date,T0.LoadingDate)=@Date and T0.ShiftId=@ShiftId
			Union
			select T2.OperatorName as ShiftIncharge,RE.Name as Relay from Trans.TblCrusher T0 join Trans.TblCrusherShiftIncharge T1 on T1.CrusherId=T0.SlNo join Master.TblOperator T2 on T2.SlNo=T1.OperatorId JOIN Master.TblRelay RE on RE.SlNo=T0.RelayId where T0.IsDelete=0 and Convert(date,T0.Date)=@Date and T0.ShiftId=@ShiftId
		)

		Select (SELECT STRING_AGG(ShiftIncharge, ', ') FROM (SELECT DISTINCT ShiftIncharge FROM FilterDate) AS SI) AS ShiftIncharge,
		(SELECT STRING_AGG(Relay, ', ') FROM (SELECT DISTINCT Relay FROM FilterDate) AS RE) AS Relay,
		(Select TOP 1 ShiftName from Master.TblShift where SlNo=@ShiftId) as ShiftName,FORMAT(@Date,'dd-MMM-yyyy') as Date,'' as Logo	 
END
