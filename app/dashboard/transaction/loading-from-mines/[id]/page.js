import TransactionForm from '@/components/TransactionForm';
import { notFound } from 'next/navigation';
import { executeQuery, sql } from '@/lib/db';

// Server Component for Initial Data Fetching
// TODO: Can we use server components here? 
// TransactionForm is 'use client'.
// We can fetch data in this Server Component and pass as prop.

async function getData(id) {
    try {
        const safeId = parseInt(id);
        console.log(`🔍 Edit Page: Fetching data for ID: ${id} (Parsed: ${safeId})`);

        if (isNaN(safeId)) {
            console.error("❌ Edit Page: Invalid ID format");
            return null;
        }

        // 1. Fetch Main Transaction Data
        const queryMain = `
            SELECT 
                SlNo,
                LoadingDate,
                ShiftId,
                ManPowerInShift AS ManPower,
                RelayId,
                SourceId,
                DestinationId,
                MaterialId,
                HaulerEquipmentId AS HaulerId,
                LoadingMachineEquipmentId AS LoadingMachineId,
                NoofTrip AS NoOfTrips,
                QtyTrip,
                NtpcQtyTrip, 
                UnitId,
                TotalQty,
                TotalNtpcQty,
                Remarks,
                ShiftInchargeId,
                MidScaleInchargeId
            FROM [Trans].[TblLoading] 
            WHERE SlNo = @id AND IsDelete = 0
        `;

        const res = await executeQuery(queryMain, [
            { name: 'id', type: sql.Int, value: safeId }
        ]);

        const mainData = res[0];
        if (!mainData) {
            console.error(`❌ Edit Page: No record found for ID ${safeId}`);
            return null;
        }

        // Removed Legacy Multi-Select Fetch Logic

        console.log("✅ Edit Page: Data Fetched", mainData);

        return mainData;
    } catch (e) {
        console.error("❌ Edit Page: getData CRITICAL FAIL. Error: " + e.message);
        return null;
    }
}

export default async function EditPage({ params }) {
    const { id } = await params; // Next 15+ needs await
    const data = await getData(id);

    if (!data) return notFound();

    // Serialize Dates
    const serialized = JSON.parse(JSON.stringify(data));

    return <TransactionForm isEdit={true} initialData={serialized} />;
}
