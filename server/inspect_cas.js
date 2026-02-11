const { getConnection } = require('./db');

async function inspect() {
    try {
        const pool = await getConnection();

        console.log('--- GAC_APP_TB_CAS ---');
        const cas = await pool.request().query('SELECT TOP 1 * FROM [dbo].[GAC_APP_TB_CAS]');
        if (cas.recordset.length > 0) {
            console.log(Object.keys(cas.recordset[0]));
            console.log('Sample:', cas.recordset[0]);
        } else {
            console.log('Empty table');
        }

        console.log('\n--- GAC_APP_TB_USUARIOS (Columns) ---');
        const users = await pool.request().query('SELECT TOP 1 Empresa, * FROM [dbo].[GAC_APP_TB_USUARIOS]');
        // Just checking if Empresa exists and looking at a sample
        if (users.recordset.length > 0) {
            console.log('Sample User Empresa:', users.recordset[0].Empresa);
        }

        console.log('\n--- APPGAC.Servicios (Columns) ---');
        const tickets = await pool.request().query('SELECT TOP 1 IDEmpresa, * FROM [APPGAC].[Servicios]');
        if (tickets.recordset.length > 0) {
            console.log('Sample Ticket IDEmpresa:', tickets.recordset[0].IDEmpresa);
        }

    } catch (err) {
        console.error(err);
    }
}

inspect();
