const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// --- Manual .env Loading (Fallback if not provided by PM2/System) ---
// This allows 'node server.js' to work with a .env file locally or on server
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('[Server] Loading .env file from:', envPath);
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const [key, ...msg] = line.split('=');
            if (key) {
                const val = msg.join('=').trim().replace(/^["']|["']$/g, ''); // Remove quotes
                if (!process.env[key.trim()]) {
                    process.env[key.trim()] = val;
                }
            }
        }
    });
}

console.log('------------------------------------------------');
console.log('DEBUG: Effective DB Configuration:');
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '****** (Set)' : '(Not Set)');
console.log('------------------------------------------------');
// -------------------------------------------------

// -------------------------------------------------

// Force Production Mode for Manual Start (node server.js)
process.env.NODE_ENV = 'production';
const dev = false;
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log(`[Server] Starting Next.js app on port ${port}...`);

app.prepare().then(() => {
    createServer(async (req, res) => {
        try {
            console.log(`[REQUEST] ${req.method} ${req.url}`); // Debug Log
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('[Server] Error handling request:', err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        }
    }).listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://${hostname}:${port}`);
    });
}).catch((err) => {
    console.error('[Server] Failed to prepare app:', err);
    process.exit(1);
});
