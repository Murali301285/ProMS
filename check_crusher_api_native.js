async function testCreate() {
    try {
        const payload = {
            Date: '2025-01-01',
            ShiftId: 1,
            ShiftInChargeId: '', // Empty string -> Should become null
            MidScaleInchargeId: '0', // "0" string -> Should become null
            PlantId: 1,
            EquipmentId: '0', // "0" string -> Should become null
            ProductionUnitId: 2,
            TripQtyUnitId: 2,
            UserName: 'TestUser'
        };

        console.log("Sending Payload:", payload);

        const res = await fetch('http://localhost:3003/api/transaction/crusher/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

testCreate();
