const { getConnection } = require('./db');

async function inspect() {
    try {
        const pool = await getConnection();

        console.log('--- GAC_APP_TB_CAS (Non-null Codigo_FSM) ---');
        const cas = await pool.request().query("SELECT TOP 5 id, Nombre, Codigo_FSM FROM [dbo].[GAC_APP_TB_CAS] WHERE Codigo_FSM IS NOT NULL");
        if (cas.recordset.length > 0) {
            console.log('Sample:', cas.recordset);
        } else {
            console.log('No rows with Codigo_FSM found');
        }

    } catch (err) {
        console.error(err);
    }
}

inspect();
