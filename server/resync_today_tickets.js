const sql = require('mssql');
const { getConnection } = require('./db');

async function resyncTodayTickets() {
    try {
        console.log('='.repeat(60));
        console.log('RESINCRONIZACIÓN DE TICKETS DEL DÍA');
        console.log('Fecha: 11 de febrero de 2026');
        console.log('='.repeat(60) + '\n');

        const pool = await getConnection();

        // 1. Contar tickets existentes de hoy
        console.log('1. Verificando tickets actuales de hoy...');
        const countBefore = await pool.request().query(`
            SELECT COUNT(*) as Total
            FROM [SIATC].[Tickets]
            WHERE CAST(FechaVisita AS DATE) = CAST(GETDATE() AS DATE)
        `);
        console.log(`   Tickets actuales del día: ${countBefore.recordset[0].Total}\n`);

        // 2. Obtener tickets de la tabla origen para hoy
        console.log('2. Obteniendo tickets desde [APPGAC].[Servicios]...');
        const sourceTickets = await pool.request().query(`
            SELECT 
                TRIM(Ticket) as Ticket,
                TRIM(LlamadaFSM) as LlamadaFSM,
                TRIM(IdServicio) as IdServicio,
                TRIM(IdCliente) as IdCliente,
                TRIM(IDEmpresa) as IDEmpresa,
                TRIM(Estado) as Estado,
                FechaVisita,
                FechaUltimaModificacion,
                TRIM(NombreCliente) as NombreCliente,
                TRIM(CodigoExternoCliente) as CodigoExternoCliente,
                TRIM(Email) as Email,
                TRIM(Celular1) as Celular1,
                TRIM(Celular2) as Celular2,
                TRIM(Telefono1) as Telefono1,
                TRIM(Calle) as Calle,
                TRIM(NumeroCalle) as NumeroCalle,
                TRIM(Distrito) as Distrito,
                TRIM(Ciudad) as Ciudad,
                TRIM(Pais) as Pais,
                TRIM(CodigoPostal) as CodigoPostal,
                Latitud,
                Longitud,
                TRIM(Referencia) as Referencia,
                TRIM(IdEquipo) as IdEquipo,
                TRIM(NombreEquipo) as NombreEquipo,
                TRIM(CodigoExternoEquipo) as CodigoExternoEquipo,
                TRIM(Asunto) as Asunto,
                TRIM(CodigoTecnico) as CodigoTecnico,
                TRIM(NombreTecnico) as NombreTecnico,
                TRIM(ApellidoTecnico) as ApellidoTecnico,
                VisitaRealizada,
                TrabajoRealizado,
                SolicitaNuevaVisita,
                TRIM(MotivoNuevaVisita) as MotivoNuevaVisita,
                TRIM(CodMotivoIncidente) as CodMotivoIncidente,
                TRIM(ComentarioProgramador) as ComentarioProgramador,
                TRIM(ComentarioTecnico) as ComentarioTecnico,
                CheckOut,
                FechaModificacionIT
            FROM [APPGAC].[Servicios]
            WHERE CAST(FechaVisita AS DATE) = CAST(GETDATE() AS DATE)
                OR CAST(FechaUltimaModificacion AS DATE) = CAST(GETDATE() AS DATE)
        `);

        const sourceCount = sourceTickets.recordset.length;
        console.log(`   Tickets encontrados en origen: ${sourceCount}\n`);

        if (sourceCount === 0) {
            console.log('⚠️  No hay tickets de hoy en la tabla origen.');
            console.log('   Esto podría indicar un problema con la sincronización.\n');
            return;
        }

        // 3. Hacer MERGE en batch (más rápido)
        console.log('3. Sincronizando tickets en batch...');
        
        const request = pool.request();
        request.timeout = 120000; // 2 minutos
        
        const result = await request.query(`
            MERGE [SIATC].[Tickets] AS target
            USING (
                SELECT 
                    TRIM(Ticket) as Ticket,
                    TRIM(LlamadaFSM) as LlamadaFSM,
                    TRIM(IdServicio) as IdServicio,
                    TRIM(IdCliente) as IdCliente,
                    TRIM(IDEmpresa) as IDEmpresa,
                    TRIM(Estado) as Estado,
                    FechaVisita,
                    FechaUltimaModificacion,
                    TRIM(NombreCliente) as NombreCliente,
                    TRIM(CodigoExternoCliente) as CodigoExternoCliente,
                    TRIM(Email) as Email,
                    TRIM(Celular1) as Celular1,
                    TRIM(Celular2) as Celular2,
                    TRIM(Telefono1) as Telefono1,
                    TRIM(Calle) as Calle,
                    TRIM(NumeroCalle) as NumeroCalle,
                    TRIM(Distrito) as Distrito,
                    TRIM(Ciudad) as Ciudad,
                    TRIM(Pais) as Pais,
                    TRIM(CodigoPostal) as CodigoPostal,
                    TRY_CAST(Latitud AS DECIMAL(10, 7)) as Latitud,
                    TRY_CAST(Longitud AS DECIMAL(10, 7)) as Longitud,
                    TRIM(Referencia) as Referencia,
                    TRIM(IdEquipo) as IdEquipo,
                    TRIM(NombreEquipo) as NombreEquipo,
                    TRIM(CodigoExternoEquipo) as CodigoExternoEquipo,
                    TRIM(Asunto) as Asunto,
                    TRIM(CodigoTecnico) as CodigoTecnico,
                    TRIM(NombreTecnico) as NombreTecnico,
                    TRIM(ApellidoTecnico) as ApellidoTecnico,
                    ISNULL(VisitaRealizada, 0) as VisitaRealizada,
                    ISNULL(TrabajoRealizado, 0) as TrabajoRealizado,
                    ISNULL(SolicitaNuevaVisita, 0) as SolicitaNuevaVisita,
                    TRIM(MotivoNuevaVisita) as MotivoNuevaVisita,
                    TRIM(CodMotivoIncidente) as CodMotivoIncidente,
                    TRIM(ComentarioProgramador) as ComentarioProgramador,
                    TRIM(ComentarioTecnico) as ComentarioTecnico,
                    CheckOut,
                    FechaModificacionIT
                FROM [APPGAC].[Servicios]
                WHERE CAST(FechaVisita AS DATE) = CAST(GETDATE() AS DATE)
                    OR CAST(FechaUltimaModificacion AS DATE) = CAST(GETDATE() AS DATE)
            ) AS source
            ON target.Ticket = source.Ticket
            WHEN MATCHED THEN
                UPDATE SET
                    target.LlamadaFSM = source.LlamadaFSM,
                    target.IdServicio = source.IdServicio,
                    target.IdCliente = source.IdCliente,
                    target.IDEmpresa = source.IDEmpresa,
                    target.Estado = source.Estado,
                    target.FechaVisita = source.FechaVisita,
                    target.FechaUltimaModificacion = source.FechaUltimaModificacion,
                    target.LastSync = GETDATE(),
                    target.NombreCliente = source.NombreCliente,
                    target.CodigoExternoCliente = source.CodigoExternoCliente,
                    target.Email = source.Email,
                    target.Celular1 = source.Celular1,
                    target.Celular2 = source.Celular2,
                    target.Telefono1 = source.Telefono1,
                    target.Calle = source.Calle,
                    target.NumeroCalle = source.NumeroCalle,
                    target.Distrito = source.Distrito,
                    target.Ciudad = source.Ciudad,
                    target.Pais = source.Pais,
                    target.CodigoPostal = source.CodigoPostal,
                    target.Latitud = source.Latitud,
                    target.Longitud = source.Longitud,
                    target.Referencia = source.Referencia,
                    target.IdEquipo = source.IdEquipo,
                    target.NombreEquipo = source.NombreEquipo,
                    target.CodigoExternoEquipo = source.CodigoExternoEquipo,
                    target.Asunto = source.Asunto,
                    target.CodigoTecnico = source.CodigoTecnico,
                    target.NombreTecnico = source.NombreTecnico,
                    target.ApellidoTecnico = source.ApellidoTecnico,
                    target.VisitaRealizada = source.VisitaRealizada,
                    target.TrabajoRealizado = source.TrabajoRealizado,
                    target.SolicitaNuevaVisita = source.SolicitaNuevaVisita,
                    target.MotivoNuevaVisita = source.MotivoNuevaVisita,
                    target.CodMotivoIncidente = source.CodMotivoIncidente,
                    target.ComentarioProgramador = source.ComentarioProgramador,
                    target.ComentarioTecnico = source.ComentarioTecnico,
                    target.CheckOut = source.CheckOut,
                    target.FechaModificacionIT = source.FechaModificacionIT
            WHEN NOT MATCHED THEN
                INSERT (
                    Ticket, LlamadaFSM, IdServicio, IdCliente, IDEmpresa,
                    Estado, FechaVisita, FechaUltimaModificacion, LastSync,
                    NombreCliente, CodigoExternoCliente, Email,
                    Celular1, Celular2, Telefono1,
                    Calle, NumeroCalle, Distrito, Ciudad, Pais, CodigoPostal,
                    Latitud, Longitud, Referencia,
                    IdEquipo, NombreEquipo, CodigoExternoEquipo, Asunto,
                    CodigoTecnico, NombreTecnico, ApellidoTecnico,
                    VisitaRealizada, TrabajoRealizado, SolicitaNuevaVisita,
                    MotivoNuevaVisita, CodMotivoIncidente,
                    ComentarioProgramador, ComentarioTecnico,
                    CheckOut, FechaModificacionIT
                )
                VALUES (
                    source.Ticket, source.LlamadaFSM, source.IdServicio, source.IdCliente, source.IDEmpresa,
                    source.Estado, source.FechaVisita, source.FechaUltimaModificacion, GETDATE(),
                    source.NombreCliente, source.CodigoExternoCliente, source.Email,
                    source.Celular1, source.Celular2, source.Telefono1,
                    source.Calle, source.NumeroCalle, source.Distrito, source.Ciudad, source.Pais, source.CodigoPostal,
                    source.Latitud, source.Longitud, source.Referencia,
                    source.IdEquipo, source.NombreEquipo, source.CodigoExternoEquipo, source.Asunto,
                    source.CodigoTecnico, source.NombreTecnico, source.ApellidoTecnico,
                    source.VisitaRealizada, source.TrabajoRealizado, source.SolicitaNuevaVisita,
                    source.MotivoNuevaVisita, source.CodMotivoIncidente,
                    source.ComentarioProgramador, source.ComentarioTecnico,
                    source.CheckOut, source.FechaModificacionIT
                )
            OUTPUT $action;
        `);

        const updated = result.recordset.filter(r => r.$action === 'UPDATE').length;
        const inserted = result.recordset.filter(r => r.$action === 'INSERT').length;

        console.log(`   ✓ Tickets actualizados: ${updated}`);
        console.log(`   ✓ Tickets insertados: ${inserted}\n`);

        // 4. Verificar count final
        console.log('4. Verificando resultado final...');
        const countAfter = await pool.request().query(`
            SELECT COUNT(*) as Total
            FROM [SIATC].[Tickets]
            WHERE CAST(FechaVisita AS DATE) = CAST(GETDATE() AS DATE)
        `);
        console.log(`   Total tickets del día: ${countAfter.recordset[0].Total}\n`);

        // 5. Reporte de estados
        console.log('5. Distribución por estado (hoy):');
        const estados = await pool.request().query(`
            SELECT 
                Estado,
                COUNT(*) as Cantidad
            FROM [SIATC].[Tickets]
            WHERE CAST(FechaVisita AS DATE) = CAST(GETDATE() AS DATE)
            GROUP BY Estado
            ORDER BY Cantidad DESC
        `);
        console.table(estados.recordset);

        console.log('\n' + '='.repeat(60));
        console.log('✓ RESINCRONIZACIÓN COMPLETADA');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('✗ ERROR EN RESINCRONIZACIÓN');
        console.error('='.repeat(60));
        console.error(error);
        process.exit(1);
    }
}

resyncTodayTickets();
