
const baseUrl = 'http://localhost:3000';

async function run() {
    try {
        console.log("Testing Helpers...");
        const helpers = await fetch(`${baseUrl}/api/transaction/water-tanker-entry/helpers`);
        const hData = await helpers.json();
        console.log("Helpers:", Object.keys(hData));

        if (!hData.shifts || hData.shifts.length === 0) {
            console.warn("No shifts found, cannot test POST properly without valid ShiftID");
            // fetch active shifts manually if needed or abort
        }

        // Pick valid IDs
        const shiftId = hData.shifts?.[0]?.SlNo || 1;
        const destId = hData.fillingPoints?.[0]?.SlNo || 1;
        const haulerId = hData.haulers?.[0]?.SlNo || 1;
        const fillPtId = hData.fillingPoints?.[0]?.SlNo || 1;
        const pumpId = hData.fillingPumps?.[0]?.SlNo || 1;

        console.log("Testing POST...");
        const postRes = await fetch(`${baseUrl}/api/transaction/water-tanker-entry`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ShiftId: shiftId,
                DestinationId: destId,
                HaulerId: haulerId,
                FillingPointId: fillPtId,
                FillingPumpId: pumpId,
                NoOfTrip: 2,
                TotalQty: 20,
                Remarks: 'Test Entry via Script',
                EntryDate: new Date().toISOString().slice(0, 10)
            })
        });
        const postJson = await postRes.json();
        console.log("POST Result:", postJson);

        console.log("Testing LIST...");
        const listRes = await fetch(`${baseUrl}/api/transaction/water-tanker-entry`);
        const listJson = await listRes.json();
        console.log("List Count:", listJson.length);

        const myEntry = listJson.find(x => x.Remarks === 'Test Entry via Script');
        if (myEntry) {
            console.log("Found Entry ID:", myEntry.SlNo);

            console.log("Testing DELETE...");
            const delRes = await fetch(`${baseUrl}/api/transaction/water-tanker-entry/${myEntry.SlNo}`, {
                method: 'DELETE'
            });
            console.log("DELETE Result:", await delRes.json());
        } else {
            console.error("Entry not found in List!");
        }

    } catch (e) {
        console.error("Test Failed:", e);
    }
}
run();
