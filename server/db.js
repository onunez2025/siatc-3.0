const sql = require('mssql');
require('dotenv').config();

// Contraseña con caracteres especiales - hardcodeada para evitar problemas con env vars
const DB_PASSWORD = '@s0le@dm1nAI#82,';

const config = {
    user: process.env.DB_USER || 'soledbserveradmin',
    password: DB_PASSWORD,
    server: process.env.DB_SERVER || 'soledbserver.database.windows.net',
    database: process.env.DB_NAME || 'soledb-puntoventa',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

pool.on('error', err => {
    console.error('SQL Connection Pool Error:', err);
});

async function getConnection() {
    await poolConnect;
    return pool;
}

module.exports = {
    sql,
    getConnection
};
