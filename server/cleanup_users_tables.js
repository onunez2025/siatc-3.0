const sql = require('mssql');

const config = {
    server: 'soledbserver.database.windows.net',
    port: 1433,
    database: 'soledb-puntoventa',
    user: 'soledbserveradmin',
    password: '@s0le@dm1nAI#82,',
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    }
};

async function cleanupTables() {
    let pool;
    
    try {
        console.log('Conectando a la base de datos...');
        pool = await sql.connect(config);
        console.log('✓ Conexión establecida\n');

        console.log('Eliminando registros de tablas...');
        
        // Eliminar en orden debido a foreign keys
        await pool.request().query('DELETE FROM [SIATC].[Usuarios]');
        console.log('✓ Usuarios eliminados');
        
        await pool.request().query('DELETE FROM [SIATC].[Empresas]');
        console.log('✓ Empresas eliminadas');
        
        await pool.request().query('DELETE FROM [SIATC].[Roles]');
        console.log('✓ Roles eliminados');
        
        // Reinsertar roles
        await pool.request().query(`
            INSERT INTO [SIATC].[Roles] ([NombreRol], [Descripcion])
            VALUES 
                ('ADMIN', 'Administrador del sistema con acceso completo'),
                ('SUPERVISOR', 'Supervisor de operaciones con acceso de gestión'),
                ('TECNICO', 'Técnico de campo con acceso a tickets asignados'),
                ('OPERADOR', 'Operador con acceso limitado a consultas'),
                ('CHOFER', 'Chofer con acceso a rutas y tickets'),
                ('ASISTENTE', 'Asistente administrativo con permisos básicos')
        `);
        console.log('✓ Roles reinsertados');
        
        console.log('\n✓ Limpieza completada. Listo para ejecutar migración.');
        
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

cleanupTables();
