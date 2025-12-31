SELECT SlNo, Date, CreatedDate, DispatchLocationId, Trip, TotalQty 
FROM [Trans].[TblDispatchEntry] 
WHERE Date >= '2025-12-01' AND Date <= '2025-12-29 23:59:59'
ORDER BY Date DESC;

SELECT SlNo, Date, CreatedDate FROM [Trans].[TblDispatchEntry] ORDER BY SlNo DESC;
