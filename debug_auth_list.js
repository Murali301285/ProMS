// Native fetch in Node 22

async function test() {
    try {
        const res = await fetch('http://localhost:3011/api/settings/role-authorization/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roleId: 1 })
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Data Length:", Array.isArray(data) ? data.length : 'Not Array');
        console.log("Sample:", JSON.stringify(data[0] || {}));
    } catch (e) {
        console.error(e);
    }
}
test();
