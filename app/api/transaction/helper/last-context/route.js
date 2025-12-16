/* 🔒 LOCKED MODULE: DO NOT EDIT WITHOUT CONFIRMATION */
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';

export async function POST(req) {
    try {
        const { date, ShiftId, moduleType, UserId } = await req.json();

        let table = '';
        if (moduleType === 'loading-from-mines') {
            table = '[Trans].[TblLoadingFromMines]';
        } else if (moduleType === 'material-rehandling') {
            table = '[Trans].[TblMaterialRehandling]';
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

        let baseWhere = "RehandlingDate = @date AND IsDelete = 0";
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
                    SlNo, ShiftId, ManPowerInShift as ManPower, RelayId, 
                    SourceId, DestinationId, MaterialId, HaulerEquipmentId, LoadingMachineEquipmentId, UnitId as Unit,
                    CreatedDate
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
            // Fetch Incharges
            const incQuery = `SELECT OperatorId FROM [Trans].[TblMaterialRehandlingShiftIncharge] WHERE MaterialRehandlingId = @id`;
            const incRes = await executeQuery(incQuery, [{ name: 'id', type: sql.Int, value: data.SlNo }]);
            data.ShiftInchargeIds = incRes.map(x => x.OperatorId);

            return NextResponse.json({ success: true, data, source: 'Rehandling' });
        }

        // --- Priority 3: Loading Fallback ---
        // Only if Shift is provided (as per requirements for P3 logic? Or generic?)
        // Requirement: "Priority 3-> get Shift,Incharge,Man Power, Relay from [Trans].[TblLoading] from that particular date"

        // If ShiftId IS provided: check for that specific shift in Loading
        // If ShiftId IS NOT provided: maybe get the latest shift? 
        // The prompt says: "If Only Date Selected... Priority 3 -> get Shift... from TblLoading... load only data to mention controls"

        const loadingQuery = `
            SELECT TOP 1 ShiftId, ManPowerInShift as ManPower, RelayId, SlNo
            FROM [Trans].[TblLoading]
            WHERE LoadingDate = @date ${ShiftId ? "AND ShiftId = @ShiftId" : ""} AND IsDelete = 0
            ORDER BY CreatedDate DESC
        `;

        // We reuse queryParams, but need to ensure ShiftId is there if used
        const loadingRes = await executeQuery(loadingQuery, queryParams);

        if (loadingRes.length > 0) {
            const data = loadingRes[0];

            // Fetch Incharges from Loading Table
            const incQuery = `SELECT OperatorId FROM [Trans].[TblLoadingShiftIncharge] WHERE LoadingId = @id`;
            const incRes = await executeQuery(incQuery, [{ name: 'id', type: sql.Int, value: data.SlNo }]);
            data.ShiftInchargeIds = incRes.map(x => x.OperatorId);

            // Clean up unrelated fields (SlNo is from Loading, not Rehandling)
            delete data.SlNo;

            return NextResponse.json({ success: true, data, source: 'LoadingFallback' });
        }

        return NextResponse.json({ success: true, data: null });

    } catch (error) {
        console.error("Last Context Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
