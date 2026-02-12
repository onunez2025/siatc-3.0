// Ejecutar actualización de tabla Empresas
const { getConnection } = require('./db');
const fs = require('fs').promises;
const path = require('path');

async function executeSQLFile(pool, scriptPath) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Ejecutando: ${path.basename(scriptPath)}`);
    console.log('='.repeat(60));
    
    try {
        const scriptContent = await fs.readFile(scriptPath, 'utf8');
        
        const batches = scriptContent
            .split(/^\s*GO\s*$/mi)
            .map(batch => batch.trim())
            .filter(batch => batch.length > 0);
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            if (batch) {
                try {
                    const result = await pool.request().query(batch);
                    
                    if (result.recordsets && result.recordsets.length > 0) {
                        result.recordsets.forEach(recordset => {
                            if (recordset.length > 0) {
                                console.table(recordset);
                            }
                        });
                    }
                } catch (batchError) {
                    console.error(`Error en batch ${i + 1}:`, batchError.message);
                }
            }
        }
        
        console.log(`✓ Script completado`);
        return true;
    } catch (error) {
        console.error(`✗ Error:`, error.message);
        return false;
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   ACTUALIZAR TABLA EMPRESAS - CODIGO FSM                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    try {
        console.log('\n🔌 Conectando...');
        const pool = await getConnection();
        console.log('✓ Conectado');
        
        const scriptPath = path.join(__dirname, 'sql', '10_update_empresas_add_codigo_fsm.sql');
        await executeSQLFile(pool, scriptPath);
        
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║   ✓ ACTUALIZACIÓN COMPLETADA                              ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        
    } catch (error) {
        console.error('\n✗ Error:', error);
        process.exit(1);
    }
}

main();
