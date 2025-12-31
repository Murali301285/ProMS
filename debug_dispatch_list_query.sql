DECLARE @fromDate DATE = '2025-12-01';
DECLARE @toDate DATE = '2025-12-29';

SELECT 
    t.*,
    l.LocationName as DispatchLocationName,
    u.Name as UnitName,
    usr.EmpName as CreatedByName,
    usr2.EmpName as UpdatedByName
FROM [Trans].[TblDispatchEntry] t
LEFT JOIN [Master].[TblLocation] l ON t.DispatchLocationId = l.SlNo
LEFT JOIN [Master].[TblUnit] u ON t.UOMId = u.SlNo
LEFT JOIN [Master].[TblUser_New] usr ON t.CreatedBy = usr.SlNo
LEFT JOIN [Master].[TblUser_New] usr2 ON t.UpdatedBy = usr2.SlNo
WHERE (t.isDelete = 0 OR t.isDelete IS NULL) 
AND CAST(t.Date AS DATE) >= @fromDate 
AND CAST(t.Date AS DATE) <= @toDate
ORDER BY t.SlNo DESC;

-- Only run if the above fails potentially, but checking schema helps
SELECT TOP 1 * FROM [Master].[TblUser_New];
