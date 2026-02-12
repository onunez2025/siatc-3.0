// Verificar técnicos existentes y crear usuarios
const { getConnection, sql } = require('./db');

async function main() {
    try {
        const pool = await getConnection();
        
        // Verificar técnicos únicos
        console.log('Técnicos encontrados en tickets:');
        const tecnicos = await pool.request().query(`
            SELECT DISTINCT CodigoTecnico, COUNT(*) as TotalTickets
            FROM [SIATC].[Tickets]
            WHERE CodigoTecnico IS NOT NULL AND CodigoTecnico != ''
            GROUP BY CodigoTecnico
            ORDER BY TotalTickets DESC
        `);
        console.table(tecnicos.recordset);
        
        // Obtener IDs necesarios
        const empresa = await pool.request().query("SELECT IdEmpresa FROM [SIATC].[Empresas] WHERE NombreEmpresa = 'SOLE'");
        const rol = await pool.request().query("SELECT IdRol FROM [SIATC].[Roles] WHERE NombreRol = 'TECNICO'");
        
        const idEmpresa = empresa.recordset[0].IdEmpresa;
        const idRol = rol.recordset[0].IdRol;
        
        console.log(`\nCreando técnicos (IdEmpresa: ${idEmpresa}, IdRol: ${idRol})...`);
        
        // Crear usuarios para los top 5 técnicos
        for (let i = 0; i < Math.min(5, tecnicos.recordset.length); i++) {
            const codigo = tecnicos.recordset[i].CodigoTecnico;
            
            try {
                await pool.request()
                    .input('username', sql.NVarChar, codigo)
                    .input('password', sql.NVarChar, '123')
                    .input('nombre', sql.NVarChar, 'Técnico')
                    .input('apellido', sql.NVarChar, codigo)
                    .input('email', sql.NVarChar, `${codigo.toLowerCase()}@sole.com`)
                    .input('idEmpresa', sql.Int, idEmpresa)
                    .input('idRol', sql.Int, idRol)
                    .input('codigoTecnico', sql.NVarChar, codigo)
                    .query(`
                        IF NOT EXISTS (SELECT 1 FROM [SIATC].[Usuarios] WHERE Username = @username)
                        BEGIN
                            INSERT INTO [SIATC].[Usuarios] 
                            (Username, Password, Nombre, Apellido, Email, IdEmpresa, IdRol, CodigoTecnico, Activo, RequiereCambioPassword)
                            VALUES 
                            (@username, @password, @nombre, @apellido, @email, @idEmpresa, @idRol, @codigoTecnico, 1, 1)
                        END
                    `);
                console.log(`✓ Técnico ${codigo} creado`);
            } catch (err) {
                console.error(`✗ Error creando ${codigo}:`, err.message);
            }
        }
        
        // Mostrar usuarios finales
        console.log('\n\nTodos los usuarios creados:');
        const usuarios = await pool.request().query(`
            SELECT 
                U.Username,
                U.Nombre + ' ' + U.Apellido AS NombreCompleto,
                R.NombreRol,
                E.NombreEmpresa,
                E.TipoEmpresa,
                U.CodigoTecnico
            FROM [SIATC].[Usuarios] U
            INNER JOIN [SIATC].[Empresas] E ON U.IdEmpresa = E.IdEmpresa
            INNER JOIN [SIATC].[Roles] R ON U.IdRol = R.IdRol
            ORDER BY 
                CASE R.NombreRol 
                    WHEN 'ADMINISTRADOR' THEN 1
                    WHEN 'SUPERVISOR_TECNICO' THEN 2
                    WHEN 'TECNICO' THEN 3
                    ELSE 4
                END,
                U.Username
        `);
        console.table(usuarios.recordset);
        
        console.log('\n✓ Proceso completado');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
