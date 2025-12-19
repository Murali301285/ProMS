
const http = require('http');

const fetchApi = (path) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'Parse Error', raw: data });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });
        req.end();
    });
};

async function checkMasters() {
    try {
        console.log("Checking Shifts...");
        const shifts = await fetchApi('/api/master/shift');
        console.log("Shifts:", JSON.stringify(shifts, null, 2));

        console.log("Checking BD Reasons...");
        const reasons = await fetchApi('/api/master/bd-reason');
        console.log("Reasons:", JSON.stringify(reasons, null, 2));

    } catch (err) {
        console.error("Error:", err);
    }
}

checkMasters();
