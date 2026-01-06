
// Node 18+ has global fetch built-in
// Node 18+ has global fetch.

async function testApi() {
    try {
        console.log("Fetching from http://localhost:3000/api/transaction/water-tanker-entry/helpers");
        const res = await fetch('http://localhost:3000/api/transaction/water-tanker-entry/helpers');
        if (!res.ok) {
            console.error("Fetch failed:", res.status, res.statusText);
            const text = await res.text();
            console.error("Body:", text);
            return;
        }
        const json = await res.json();
        console.log("API Response Keys:", Object.keys(json));
        if (json.shifts) {
            console.log("Shifts found:", json.shifts.length);
            console.table(json.shifts);
        } else {
            console.error("No 'shifts' key in response!");
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

testApi();
