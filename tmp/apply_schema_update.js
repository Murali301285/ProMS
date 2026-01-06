const { executeQuery } = require('./lib/db');
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'update_equipment_schema.sql'), 'utf8');
        await executeQuery(sql);
        console.log("Schema Update Executed Successfully");
    } catch (e) {
        console.error("Schema Update Failed", e);
    }
}

run();
