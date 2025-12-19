
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

async function debugDrilling() {
    try {
        console.log("Connecting...");
        const pool = await new sql.ConnectionPool(config).connect();
        console.log("Connected.");
        const request = pool.request();

        const offset = 0;
        const limit = 50;
        const fromDate = '2025-12-16';
        const toDate = '2025-12-16';

        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);
        request.input('fromDate', sql.Date, fromDate);
        request.input('toDate', sql.Date, toDate);

        console.log("Executing Query...");
        const query = `
            SELECT 
                T.SlNo,
                T.Date AS DateOfDrilling,
                (
                    SELECT TOP 1 B.[Date] 
                    FROM [Trans].[TblBlasting] B 
                    WHERE B.[BlastingPatchId] = T.[DrillingPatchId]
                ) AS DateOfBlasting,
                T.DrillingPatchId,
                T.EquipmentId,
                E.EquipmentName AS Equipment,
                T.MaterialId,
                M.MaterialName AS Material,
                T.LocationId,
                L.LocationName AS Location,
                T.SectorId,
                Sec.SectorName AS Sector,
                T.ScaleId,
                Sc.Name AS Scale,
                T.StrataId,
                Str.Name AS Strata,
                T.DepthSlabId,
                DS.Name AS DepthSlab,
                T.NoofHoles,
                T.TotalMeters,
                T.Spacing,
                T.Burden,
                T.TopRLBottomRL,
                T.AverageDepth,
                T.Output,
                T.UnitId,
                U.Name AS Unit,
                T.TotalQty,
                T.RemarkId,
                DR.DrillingRemarks,
                T.Remarks,
                T.CreatedBy,
                CU.UserName AS CreatedByName,
                T.CreatedDate,
                T.UpdatedBy,
                UU.UserName AS UpdatedByName,
                T.UpdatedDate,
                COUNT(*) OVER() as TotalCount
            FROM [Trans].[TblDrilling] T
            LEFT JOIN [Master].[TblEquipment] E ON T.EquipmentId = E.SlNo
            LEFT JOIN [Master].[TblMaterial] M ON T.MaterialId = M.SlNo
            LEFT JOIN [Master].[TblLocation] L ON T.LocationId = L.SlNo
            LEFT JOIN [Master].[TblSector] Sec ON T.SectorId = Sec.SlNo
            LEFT JOIN [Master].[TblScale] Sc ON T.ScaleId = Sc.SlNo
            LEFT JOIN [Master].[TblStrata] Str ON T.StrataId = Str.SlNo
            LEFT JOIN [Master].[TblDepthSlab] DS ON T.DepthSlabId = DS.SlNo
            LEFT JOIN [Master].[TblUnit] U ON T.UnitId = U.SlNo
            LEFT JOIN [Master].[TblDrillingRemarks] DR ON T.RemarkId = DR.SlNo
            LEFT JOIN [Master].[TblUser] CU ON T.CreatedBy = CU.SlNo
            LEFT JOIN [Master].[TblUser] UU ON T.UpdatedBy = UU.SlNo
            WHERE T.IsDelete = 0 AND CAST(T.Date AS DATE) >= @fromDate AND CAST(T.Date AS DATE) <= @toDate
            ORDER BY T.Date DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `;

        await request.query(query);
        console.log("Query Executed Successfully!");
    } catch (err) {
        console.error("SQL Error:", err.message);
        if (err.originalError) console.error("Original Error:", err.originalError.message);
    } finally {
        process.exit();
    }
}

debugDrilling();
