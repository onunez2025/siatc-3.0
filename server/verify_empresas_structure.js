// Verificar estructura actualizada de Empresas
const { getConnection } = require('./db');

async function main() {
    try {
        const pool = await getConnection();
        
        console.log('ESTRUCTURA ACTUALIZADA DE TABLA EMPRESAS:\n');
        
        const result = await pool.request().query(`
            SELECT TOP 10
                IdEmpresa,
                CodigoFSM,
                NombreEmpresa,
                TipoEmpresa,
                Activo
            FROM [SIATC].[Empresas]
            ORDER BY 
                CASE WHEN TipoEmpresa = 'PROPIA' THEN 0 ELSE 1 END,
                CodigoFSM
        `);
        
        console.table(result.recordset);
        
        console.log('\n✓ CodigoFSM: Código de FSM (usado para matching con tickets)');
        console.log('✓ NombreEmpresa: Nombre real de la empresa (mostrar a usuarios)\n');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
