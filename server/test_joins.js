const { getConnection } = require('./db');

async function testJoins() {
    try {
        const pool = await getConnection();

        console.log('--- Testing User -> CAS Join ---');
        // Find a user with an Empresa
        const user = await pool.request().query("SELECT TOP 1 [ID Usuario], Empresa FROM [dbo].[GAC_APP_TB_USUARIOS] WHERE Empresa IS NOT NULL");
        if (user.recordset.length > 0) {
            const empId = user.recordset[0].Empresa;
            console.log(`User Empresa: ${empId}`);

            // Try to find the CAS
            const cas = await pool.request().query(`SELECT * FROM [dbo].[GAC_APP_TB_CAS] WHERE ID_CAS = '${empId}'`);
            if (cas.recordset.length > 0) {
                console.log('Found CAS:', cas.recordset[0].Nombre_CAS, '| Codigo_FSM:', cas.recordset[0].Codigo_FSM);

                const fsmCode = cas.recordset[0].Codigo_FSM;
                if (fsmCode) {
                    console.log('\n--- Testing CAS -> Tickets Join ---');
                    const tickets = await pool.request().query(`SELECT count(*) as count FROM [APPGAC].[Servicios] WHERE IDEmpresa = '${fsmCode}'`);
                    console.log(`Tickets found for CAS ${fsmCode}:`, tickets.recordset[0].count);
                } else {
                    console.log('CAS has no Codigo_FSM');
                }
            } else {
                console.log('CAS not found');
            }
        } else {
            console.log('No users with Empresa found');
        }

    } catch (err) {
        console.error(err);
    }
}

testJoins();
