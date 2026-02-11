const { getConnection } = require('./db');
require('dotenv').config();

async function checkSyncCount() {
    try {
        const pool = await getConnection();

        const countResult = await pool.request().query('SELECT COUNT(*) as count FROM [SIATC].[Tickets]');
        const targetCount = countResult.recordset[0].count;
        console.log(`[TARGET] SIATC.Tickets count: ${targetCount}`);

        const sourceResult = await pool.request().query('SELECT COUNT(DISTINCT Ticket) as count FROM [APPGAC].[Servicios]');
        const sourceCount = sourceResult.recordset[0].count;
        console.log(`[SOURCE] APPGAC.Servicios (Unique Tickets) count: ${sourceCount}`);

        console.log(`[DIFF] Missing: ${sourceCount - targetCount}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSyncCount();
