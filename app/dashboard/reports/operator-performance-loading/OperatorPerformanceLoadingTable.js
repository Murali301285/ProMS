import React, { useMemo } from 'react';
import DataTable from '@/components/DataTable';

export default function OperatorPerformanceLoadingTable({ data, date }) {
    if (!data) return null;

    // Transform Data: Calculate Efficiency Metrics
    const tableData = useMemo(() => {
        return data.map((r, i) => {
            // Efficiency Calculations
            const tripHr = r.WHr > 0 ? ((r.OBTrips || 0) + (r.CoalTrips || 0)) / r.WHr : 0;
            const bcmHr = r.WHr > 0 ? (r.OBQtyBCM || 0) / r.WHr : 0;

            return {
                ...r,
                // Ensure Date is formatted
                Date: r.Date ? r.Date.split('T')[0] : date,
                // Calculated Fields
                TripHr: tripHr.toFixed(2),
                BCMHr: bcmHr.toFixed(2),
                // Null checks for display (ensure numbers for DataTable filters)
                OBTrips: r.OBTrips || 0,
                OBQtyBCM: r.OBQtyBCM || 0,
                CoalTrips: r.CoalTrips || 0,
                CoalQty: r.CoalQty || 0,
                EHStart: r.EHStart?.toFixed(1) || 0,
                EHClose: r.EHClose?.toFixed(1) || 0,
                WHr: r.WHr?.toFixed(1) || 0
            };
        });
    }, [data, date]);

    // Define Columns
    const columns = [
        { accessor: 'SlNo', header: 'Si. No.', width: '60px' }, // Handled by DataTable if showSerialNo=true
        { accessor: 'Date', header: 'Date', width: '100px' },
        { accessor: 'OperatorName', header: "Operator's Name", width: '180px' },
        { accessor: 'ShiftName', header: 'Shift', width: '80px' },
        { accessor: 'VehicleNo', header: 'Vehicle No.', width: '120px' },
        { accessor: 'VehicleModel', header: 'Veh. Model', width: '120px' },
        { accessor: 'Sector', header: 'Sector', width: '100px' },
        { accessor: 'Relay', header: 'Relay', width: '100px' },
        { accessor: 'EHStart', header: 'E.H. Start', width: '90px' },
        { accessor: 'EHClose', header: 'E.H. Close', width: '90px' },
        { accessor: 'WHr', header: 'W. Hr', width: '80px' },
        { accessor: 'OBTrips', header: 'OB Trips', width: '90px' },
        { accessor: 'OBQtyBCM', header: 'Qty (BCM)', width: '100px', render: (row) => Number(row.OBQtyBCM).toLocaleString('en-IN') },
        { accessor: 'CoalTrips', header: 'Coal Trips', width: '90px' },
        { accessor: 'CoalQty', header: 'Qty (MT)', width: '100px', render: (row) => Number(row.CoalQty).toLocaleString('en-IN') },
        { accessor: 'TripHr', header: 'Trip/Hrs', width: '90px' },
        { accessor: 'BCMHr', header: 'BCM/Hrs', width: '90px' }
    ];

    return (
        <div className="w-full">
            <DataTable
                columns={columns}
                data={tableData}
                fileName={`OperatorPerformance_${date}`}
                showSerialNo={true}
                reportHeader={{
                    title: 'OPERATOR PERFORMANCE - LOADING REPORT',
                    fromDate: date,
                    toDate: date
                }}
            />
        </div>
    );
}
