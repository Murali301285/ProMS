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

        const result = await request.execute('ProMS2_SPReportCrDailyShift');

        const metricsData = result.recordsets[0] || [];
        const stoppageData = result.recordsets[1] || [];
        const remarksData = result.recordsets[2] || [];

        // Group by Shift
        const shiftsMap = {};
        // We need to preserve shift order if possible. Usually Shift A, B, C.
        // The SP orders by ShiftName.

        metricsData.forEach(row => {
            const shiftName = row.ShiftName || 'Unknown';
            if (!shiftsMap[shiftName]) {
                shiftsMap[shiftName] = {
                    name: shiftName,
                    inCharge: row.ShiftInCharge,
                    plants: [],
                    plantMetrics: {},
                    stoppages: [], // Will hold unique reasons for this shift
                    stoppageValues: {}, // Map<Reason, Map<PlantId, Hrs>>
                    remarks: {} // Map<PlantId, FormattedString>
                };
            }
            // Add Plant to Shift list if not exists
            if (!shiftsMap[shiftName].plants.find(p => p.id === row.PlantId)) {
                shiftsMap[shiftName].plants.push({
                    id: row.PlantId,
                    name: row.PlantName
                });
            }
            shiftsMap[shiftName].plantMetrics[row.PlantId] = row;
        });

        // Process Stoppages
        stoppageData.forEach(row => {
            const shiftName = row.ShiftName || 'Unknown';
            if (shiftsMap[shiftName]) {
                const shift = shiftsMap[shiftName];
                // Add reason to list
                if (!shift.stoppages.includes(row.StoppageReason)) {
                    shift.stoppages.push(row.StoppageReason);
                }

                // Map Value
                if (!shift.stoppageValues[row.StoppageReason]) {
                    shift.stoppageValues[row.StoppageReason] = {};
                }
                // We need to map by PlantId. The Stoppage result uses PlantName. 
                // Ideally SP should return PlantId. Let's lookup ID from name or assume consistent.
                // Or better, update SP to return PlantId in Set 2. 
                // For now, let's match by name from the shift.plants list.
                const plant = shift.plants.find(p => p.name === row.PlantName);
                if (plant) {
                    shift.stoppageValues[row.StoppageReason][plant.id] = row.Hrs;
                }
            }
        });

        // Helper to format Time
        const fmtTime = (d) => {
            if (!d) return '';
            const dt = new Date(d);
            return dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        };

        // Process Remarks
        remarksData.forEach(row => {
            const shiftName = row.ShiftName || 'Unknown';
            if (shiftsMap[shiftName]) {
                const shift = shiftsMap[shiftName];
                const pId = row.PlantId;

                let remarkText = row.Remarks || '';

                if (row.Source === 'Stop') {
                    const from = fmtTime(row.FromTime);
                    const to = fmtTime(row.ToTime);
                    const durationMins = row.DurationHours ? Math.round(Number(row.DurationHours) * 60) : 0;

                    if (from && to && from !== 'Invalid Date') {
                        let durStr = `${durationMins} minutes`;
                        if (durationMins > 60) {
                            const hrs = (durationMins / 60).toFixed(2);
                            durStr = `${hrs} hrs`;
                        }
                        remarkText = `time ${from} to ${to} total ${durStr} - ${remarkText}`;
                    }
                }

                if (!shift.remarks[pId]) shift.remarks[pId] = [];
                if (remarkText) {
                    const serial = shift.remarks[pId].length + 1;
                    shift.remarks[pId].push(`${serial}. ${remarkText}`);
                }
            }
        });

        // Format final response
        const shifts = Object.values(shiftsMap).map(s => {
            // Sort Stoppages
            s.stoppages.sort();
            // Join Remarks
            Object.keys(s.remarks).forEach(pId => {
                s.remarks[pId] = s.remarks[pId].join('\n');
            });
            return s;
        });

        return NextResponse.json({
            success: true,
            data: shifts
        });

    } catch (error) {
        console.error("Cr Shift Report Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
