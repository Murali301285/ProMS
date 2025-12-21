import { getDbConnection, sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { date } = await req.json();

        if (!date) {
            return NextResponse.json({ success: false, message: 'Date is required' }, { status: 400 });
        }

        const pool = await getDbConnection();
        const request = pool.request();

        request.input('Date', sql.Date, date);

        // Execute Stored Procedure
        const result = await request.execute('ProMS2_SPReportCrusherSummary');

        // Result Sets:
        // [0]: Daily Production (Per Plant & Shift)
        // [1]: Cumulative Production (FTM & YTD)
        // [2]: Stoppages
        // [3]: HMR & BSR Metrics

        const dailyData = result.recordsets[0] || [];
        const cumulativeData = result.recordsets[1] || [];
        const stoppageData = result.recordsets[2] || [];
        const hmrData = result.recordsets[3] || [];

        // Process Data (Client Agnostic Logic)
        const plantMap = new Map();

        // 1. Initialize from HMR Data (contains all active DPR plants)
        hmrData.forEach(row => {
            const pId = row.PlantId;
            if (!plantMap.has(pId)) {
                plantMap.set(pId, {
                    SlNo: pId,
                    PlantName: row.PlantName,
                    shifts: {},
                    RunningHr: 0,
                    ProductionQty: 0,
                    ProdFTM: 0,
                    ProdYTD: 0,
                    TotalStopHrs: 0,
                    StopRemarks: [],
                    CrusherRemarks: [], // While column removed from SP, we might still want to hold place if needed later, or can remove. keeping consistent.
                    HMR: row
                });
            }
        });

        // 2. Fill Daily Production
        dailyData.forEach(row => {
            const pId = row.PlantId;
            if (!plantMap.has(pId)) {
                plantMap.set(pId, { SlNo: pId, PlantName: row.PlantName, shifts: {}, RunningHr: 0, ProductionQty: 0, ProdFTM: 0, ProdYTD: 0, TotalStopHrs: 0, StopRemarks: [], CrusherRemarks: [], HMR: {} });
            }
            const p = plantMap.get(pId);
            p.PlantName = row.PlantName;
            p.shifts[row.ShiftName] = row.ProductionQty;
            p.RunningHr += row.RunningHr;
            p.ProductionQty += row.ProductionQty;
        });

        // 3. Fill Cumulative
        cumulativeData.forEach(row => {
            const pId = row.PlantId;
            if (plantMap.has(pId)) {
                const p = plantMap.get(pId);
                p.ProdFTM = row.ProdFTM;
                p.ProdYTD = row.ProdYTD;
            }
        });

        // 4. Fill Stoppages (Aggregated)
        // No longer distinct reasons. Just per plant total.
        stoppageData.forEach(row => {
            const pId = row.PlantId;
            if (plantMap.has(pId)) {
                const p = plantMap.get(pId);
                p.TotalStopHrs = row.TotalStopHrs; // Total for day
                if (row.StopRemarks) p.StopRemarks.push(row.StopRemarks);
            }
        });

        // 5. Final Transform
        const finalData = Array.from(plantMap.values()).map(p => {
            // HMR Calculations new keys
            const monthStartHMR = p.HMR.MonthStartingHMR || 0;
            const closingHMR = p.HMR.AsonDateClosingHMR || 0;
            const monthlyCumRHR = closingHMR - monthStartHMR;

            const monthStartBSR = p.HMR.MonthStartingBSR || 0;
            const closingBSR = p.HMR.AsonDateClosingBSR || 0;
            const monthlyCumBSR = closingBSR - monthStartBSR;

            // FAD (Avg TPH FTM)
            let avgTphFtm = 0;
            if (monthlyCumRHR > 0) {
                avgTphFtm = p.ProdFTM / monthlyCumRHR;
            }

            return {
                ...p,
                monthlyCumRHR,
                monthlyCumBSR,
                avgTphFtm,
                budgetFtm: p.HMR.BudgetFTM,
                remarksCombined: p.StopRemarks.join('\n') // Only StopRemarks now as CrusherRemarks removed
            };
        });

        const shiftNames = ['Shift-A', 'Shift-B', 'Shift-C'];

        return NextResponse.json({
            success: true,
            data: finalData,
            meta: {
                shiftNames
                // No stoppageReasons meta needed
            }
        });

    } catch (error) {
        console.error("Crusher Summary Report Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
