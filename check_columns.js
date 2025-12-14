
const { executeQuery } = require('./lib/db');

async function checkColumns() {
    try {
        console.log("Checking [Trans].[TblLoading] columns...");
        const cols = await executeQuery("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblLoading' AND TABLE_SCHEMA = 'Trans'");
        console.table(cols);

        console.log("Checking [Trans].[TblLoadingShiftIncharge] columns...");
        const cols2 = await executeQuery("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblLoadingShiftIncharge' AND TABLE_SCHEMA = 'Trans'");
        console.table(cols2);

    } catch (err) {
        console.error(err);
    }
}

checkColumns();
