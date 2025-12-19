
const fs = require('fs');

async function testApi() {
    try {
        console.log("Logging in...");
        const loginRes = await fetch('http://localhost:3011/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });

        if (!loginRes.ok) {
            console.error("Login failed:", await loginRes.text());
            return;
        }

        const loginCookies = loginRes.headers.get('set-cookie');
        console.log("Login Cookies:", loginCookies);

        // Parse Cookies manually or just pass them along (fetch handles array of cookies differently depending on version)
        // Helper to extract value
        const getCookieVal = (name) => {
            const match = loginCookies.match(new RegExp(name + '=([^;]+)'));
            return match ? match[1] : null;
        }

        const token = getCookieVal('auth_token');
        const roleId = getCookieVal('role_id');

        console.log(`Token: ${token?.substring(0, 10)}..., RoleId: ${roleId}`);

        console.log("Fetching Menu Tree...");
        const menuRes = await fetch('http://localhost:3011/api/setup/menu-tree', {
            headers: {
                'Cookie': loginCookies // Pass raw cookie string? Fetch might not support this directly in Node?
                // Node fetch usually expects 'Cookie' header.
            }
        });

        const data = await menuRes.json();
        console.log("Menu Tree Response Keys:", data.map(m => m.name));

        const reports = data.find(m => m.name === 'Reports');
        if (reports) {
            console.log("Reports Module found:", JSON.stringify(reports, null, 2));
        } else {
            console.log("Reports Module NOT found in API response.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testApi();
