const { getConnection } = require('./db');
const http = require('http');

async function debug() {
    try {
        const pool = await getConnection();

        // 1. Check DB Count
        const countResult = await pool.request().query('SELECT COUNT(*) as count FROM [SIATC].[Tickets]');
        console.log(`[DB] SIATC.Tickets count: ${countResult.recordset[0].count}`);

        // 2. Check API
        console.log('[API] Calling GET http://localhost:3001/api/tickets ...');
        http.get('http://localhost:3001/api/tickets', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`[API] Status: ${res.statusCode}`);
                try {
                    const json = JSON.parse(data);
                    console.log(`[API] Total: ${json.pagination?.total}`);
                    console.log(`[API] Data Length: ${json.data?.length}`);
                    if (json.data?.length > 0) {
                        console.log('[API] First Ticket:', JSON.stringify(json.data[0], null, 2));
                    }
                    if (json.error) {
                        console.log('[API] Error in JSON:', json.error, json.details);
                    }
                } catch (e) {
                    console.log('[API] Raw Response:', data);
                }
                process.exit(0);
            });
        }).on('error', (err) => {
            console.error('[API] Error:', err.message);
            process.exit(1);
        });

    } catch (err) {
        console.error('[DB] Error:', err);
        process.exit(1);
    }
}

debug();
