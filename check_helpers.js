
// const fetch = require('node-fetch'); // Not needed in Node 22

const BASE_URL = 'http://localhost:3006';

async function checkEndpoint(path, payload) {
    try {
        console.log(`Checking ${path}...`);
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log(`Status: ${res.status} ${res.statusText}`);
        if (!res.ok) {
            console.log(await res.text());
        } else {
            const json = await res.json();
            console.log('Response:', JSON.stringify(json).substring(0, 100) + '...');
        }
    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
    console.log('---');
}

async function run() {
    await checkEndpoint('/api/transaction/helper/check-duplicate-equipment', {
        Date: '2025-12-28', ShiftId: 1, RelayId: 1, ActivityId: 1, EquipmentId: 1
    });

    await checkEndpoint('/api/transaction/helper/last-equipment-reading-context', {
        date: '2025-12-28', shiftId: 1, userId: 1
    });

    await checkEndpoint('/api/transaction/helper/last-meter-reading', {
        equipmentId: 1
    });
}

run();
