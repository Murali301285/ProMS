module.exports = {
    apps: [
        {
            name: "proms2-app",
            script: "server.js", // Run the custom server file
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
            env: {
                NODE_ENV: "production",
                PORT: 3000,
                DB_USER: "sa",
                DB_PASSWORD: "Tsmpl@258#", // Updated Correct Password
                DB_SERVER: "184.168.127.253\\SQLEXPRESS",
                DB_PORT: "1433", // Restored Port 1433 (Critical!)
                DB_DATABASE: "ProMS2_test"
            }
        }
    ]
};
