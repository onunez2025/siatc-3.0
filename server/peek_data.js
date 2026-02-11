
const sql = require('mssql');

const config = {
    user: 'soledbserveradmin',
    password: '@s0le@dm1nAI#82,',
    server: 'soledbserver.database.windows.net',
    database: 'soledb-puntoventa',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function inspect() {
    console.log('Connecting...');
    try {
        let pool = await sql.connect(config);
        console.log('Connected.');
        let result = await pool.request().query('SELECT TOP 5 FechaVisita FROM [APPGAC].[Servicios]');
        console.log('Data fetched:');
        console.log(JSON.stringify(result.recordset, null, 2));
        await sql.close();
    } catch (err) {
        console.error('ERROR:', err);
    }
}

inspect();
