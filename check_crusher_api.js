const fetch = require('node-fetch');

async function testCreate() {
    try {
        const payload = {
            Date: '2025-01-01',
            ShiftId: 1,
            ShiftInChargeId: '', // Empty string to trigger potential error
            MidScaleInchargeId: '',
            PlantId: 1,
            EquipmentId: 1,
            ProductionUnitId: 2,
            TripQtyUnitId: 2
        };

        const res = await fetch('http://localhost:3003/api/transaction/crusher/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', data);
    } catch (err) {
        console.error('Error:', err);
    }
}

testCreate();
