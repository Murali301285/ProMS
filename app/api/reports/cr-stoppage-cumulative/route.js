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

        const result = await request.execute('ProMS2_SPReportCrusherStoppageCumulative');

        const plantMetrics = result.recordsets[0] || [];
        const stoppageDetails = result.recordsets[1] || [];

        // 1. Get Unique Plants
        // We use the plantMetrics as the source of truth for columns
        const plants = plantMetrics.map(p => ({
            id: p.PlantId,
            name: p.PlantName
        }));

        // 2. Map Metrics by PlantId for easy access
        const metricsMap = {};
        plantMetrics.forEach(p => {
            metricsMap[p.PlantId] = {
                startingHour: p.StartingHour,
                closingHour: p.ClosingHour,
                runningHr: p.RunningHr,
                totalUnit: p.TotalUnit,
                totalShiftHour: p.TotalShiftHour
            };
        });

        // 3. Process Stoppages
        // We need a unique list of reasons to form the rows
        const reasonsSet = new Set();
        const stoppageMap = {}; // Map<Reason, Map<PlantId, Hrs>>

        stoppageDetails.forEach(s => {
            const reason = s.StoppageReason || 'Unknown';
            reasonsSet.add(reason);

            if (!stoppageMap[reason]) {
                stoppageMap[reason] = {};
            }
            stoppageMap[reason][s.PlantId] = s.Hrs;
        });

        const distinctReasons = Array.from(reasonsSet).sort();

        // 4. Calculate Total Stoppage Per Plant
        // (Verify against metrics or just sum the detailed rows? User asked for total at end)
        // Let's sum from the detailed stoppages to be consistent with the rows shown
        const calculatedTotalStop = {};
        plants.forEach(p => {
            let sum = 0;
            distinctReasons.forEach(r => {
                sum += (stoppageMap[r]?.[p.id] || 0);
            });
            calculatedTotalStop[p.id] = sum;
        });

        // 5. Aggregate Remarks Per Plant
        // Map 3rd result set to per-plant array
        const plantRemarksMap = {};

        // Helper to format 24h time or DateTime to HH:mm
        const fmtTime = (d) => {
            if (!d) return '';
            // If d is a Date object (mssql driver default for Time sometimes is 1970 date or array)
            // mssql driver returns Time as Date object 1970-01-01Txx:xx:00Z under UTC usually.
            const dt = new Date(d);
            return dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        };

        (result.recordsets[2] || []).forEach(r => {
            const pId = r.PlantId;
            if (!plantRemarksMap[pId]) plantRemarksMap[pId] = [];

            let remarkText = r.Remarks || '';

            if (r.Source === 'Stop') {
                const from = fmtTime(r.FromTime);
                const to = fmtTime(r.ToTime);
                const durationMins = r.DurationHours ? Math.round(Number(r.DurationHours) * 60) : 0;

                let timeStr = '';
                // Only show time if valid
                if (from && to && from !== 'Invalid Date') {
                    // Smart Duration Formatting
                    let durStr = `${durationMins} minutes`;
                    if (durationMins > 60) {
                        const hrs = (durationMins / 60).toFixed(2);
                        durStr = `${hrs} hrs`;
                    }
                    timeStr = `time ${from} to ${to} total ${durStr} - `;
                }

                remarkText = `${timeStr}${remarkText}`;
            }

            if (remarkText) {
                // Add serial number per plant
                const serial = plantRemarksMap[pId].length + 1;
                plantRemarksMap[pId].push(`${serial}. ${remarkText}`);
            }
        });

        // Assign to metricsMap
        Object.keys(plantRemarksMap).forEach(pId => {
            if (metricsMap[pId]) {
                metricsMap[pId].remarks = plantRemarksMap[pId].join('\n');
            }
        });

        // No joinedRemarks needed for footer anymore
        const joinedRemarks = "";


        return NextResponse.json({
            success: true,
            data: {
                plants,
                metricsMap,
                stoppageRows: distinctReasons.map(r => ({
                    reason: r,
                    values: stoppageMap[r] || {}
                })),
                calculatedTotalStop,
                joinedRemarks // Send to frontend
            }
        });

    } catch (error) {
        console.error("Crusher Stoppage Report Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
