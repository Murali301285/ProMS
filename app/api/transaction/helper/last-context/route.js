/* 🔒 LOCKED MODULE: DO NOT EDIT WITHOUT CONFIRMATION */
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export async function POST(req) {
    try {
        const { date, ShiftId, moduleType, UserId } = await req.json();

        let table = '';
        let dateCol = '';
        let mpCol = '';

        if (moduleType === 'loading-from-mines') {
            table = '[Trans].[TblLoading]';
            dateCol = 'LoadingDate';
            mpCol = 'ManPowerInShift';
        } else if (moduleType === 'material-rehandling') {
            table = '[Trans].[TblMaterialRehandling]';
            dateCol = 'RehandlingDate'; // Assuming this is correct for Rehandling
            mpCol = 'ManPowerInShift'; // Or ManPower? Usually standardizes.
        } else {
            return NextResponse.json({ success: false, message: 'Invalid Module Type' }, { status: 400 });
        }

        // Logic: 
        // Priority 1: Check existing data for this Date (and Shift if provided) for Logged In User
        // Priority 2: Check existing data for this Date (and Shift) for ANY User
        // Priority 3: Fallback to [Trans].[TblLoading] (Shift, Incharge, ManPower, Relay)

        let queryParams = [
            { name: 'date', type: sql.Date, value: date },
            { name: 'UserId', type: sql.Int, value: UserId || 0 }
        ];

        let baseWhere = `${dateCol} = @date AND IsDelete = 0`;
        if (ShiftId) {
            baseWhere += " AND ShiftId = @ShiftId";
            queryParams.push({ name: 'ShiftId', type: sql.Int, value: ShiftId });
        }

        // --- Priority 1 & 2: Rehandling Table ---
        const checkRehandling = async (specificUser = false) => {
            let where = baseWhere;
            if (specificUser) {
                where += " AND CreatedBy = @UserId";
            }

            const q = `
                SELECT TOP 1 
                    SlNo, ShiftId, ${mpCol} as ManPower, RelayId, 
                    SourceId, DestinationId, MaterialId, HaulerEquipmentId, LoadingMachineEquipmentId, UnitId as Unit,
                    CreatedDate, ShiftInchargeId, MidScaleInchargeId
                FROM ${table}
                WHERE ${where}
                ORDER BY CreatedDate DESC
            `;
            return await executeQuery(q, queryParams);
        };

        // P1: User Specific
        let res = await checkRehandling(true);

        // P2: Any User
        if (res.length === 0) {
            res = await checkRehandling(false);
        }

        if (res.length > 0) {
            const data = res[0];

            // Logic for Incharges: Support New Columns (Priority) -> Fallback to Link Table (Legacy)
            if (data.ShiftInchargeId || data.MidScaleInchargeId) {
                // New logic: already in data
            } else {
                // Legacy: Check Link Table
                // Only if table is Loading? (Rehandling might use link table still? Rehandling logic is separate? Rehandling uses TblMaterialRehandlingShiftIncharge)
                // Wait, if table is TblLoading, we check legacy link. 
                // If table is Rehandling, we check rehandling link.

                if (moduleType === 'loading-from-mines') {
                    const incQuery = `SELECT OperatorId FROM [Trans].[TblLoadingShiftIncharge] WHERE LoadingId = @id`;
                    const incRes = await executeQuery(incQuery, [{ name: 'id', type: sql.Int, value: data.SlNo }]);
                    // Map legacy array to ShiftInchargeId (First)? Or logic in Frontend handles it?
                    // Frontend expects scalar ShiftInchargeId. 
                    if (incRes.length > 0) data.ShiftInchargeId = incRes[0].OperatorId;
                    // Ignore others? Legacy usually implies multiple? If multiple, we just take first for "Large Scale".
                } else if (moduleType === 'material-rehandling') {
                    const incQuery = `SELECT OperatorId FROM [Trans].[TblMaterialRehandlingShiftIncharge] WHERE MaterialRehandlingId = @id`;
                    const incRes = await executeQuery(incQuery, [{ name: 'id', type: sql.Int, value: data.SlNo }]);
                    data.ShiftInchargeIds = incRes.map(x => x.OperatorId);
                }
            }

            return NextResponse.json({ success: true, data, source: 'Rehandling' });
        }

        // --- Priority 3: Loading Fallback ---
        // Enhanced Logic for Loading From Mines (User Step 1531)

        let loadingWhere = "LoadingDate = @date AND IsDelete = 0";
        if (ShiftId) {
            // If Shift IS provided, filter by it
            loadingWhere += " AND ShiftId = @ShiftId";
        }

        const loadingQuery = `
            SELECT TOP 1 ShiftId, ManPowerInShift as ManPower, RelayId, SlNo, ShiftInchargeId, MidScaleInchargeId, SourceId
            FROM [Trans].[TblLoading]
            WHERE ${loadingWhere}
            ORDER BY SlNo DESC
        `;

        // Note: loadingQuery automatically handles "Date -> Shift" case AND "Date + Shift -> Context" case.
        // If ShiftId passed: it finds latest entry for that Shift (Context).
        // If ShiftId NOT passed: it finds latest entry for that Date (Auto-fill Shift).

        // We reuse queryParams, but need to ensure ShiftId is there if used
        let loadingRes;
        try {
            loadingRes = await executeQuery(loadingQuery, queryParams);
        } catch (err) {
            console.error("Loading Query Failed:", err);
            return NextResponse.json({ success: false, message: "Loading Qry: " + err.message }, { status: 500 });
        }

        if (loadingRes.length > 0) {
            const data = loadingRes[0];

            if (!data.ShiftInchargeId && !data.MidScaleInchargeId) {
                // Limit legacy lookup to just grabbing one for ShiftInchargeId
                try {
                    const incQuery = `SELECT OperatorId FROM [Trans].[TblLoadingShiftIncharge] WHERE LoadingId = @id`;
                    const incRes = await executeQuery(incQuery, [{ name: 'id', type: sql.Int, value: data.SlNo }]);
                    if (incRes.length > 0) data.ShiftInchargeId = incRes[0].OperatorId;
                } catch (e) { console.error("Legacy Inc Fail", e); }
            }

            // Clean up unrelated fields (SlNo is from Loading, not Rehandling)
            delete data.SlNo;

            return NextResponse.json({ success: true, data, source: 'LoadingFallback' });
        } else {
            return NextResponse.json({ success: true, data: null, debug: "No Loading Data Found" });
        }

    } catch (error) {
        console.error("Last Context Error Global:", error);
        return NextResponse.json({ success: false, message: "Global: " + error.message }, { status: 500 });
    }
}
