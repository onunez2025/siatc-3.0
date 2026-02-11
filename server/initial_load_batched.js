const { getConnection } = require('./db');

const BATCH_SIZE = 5000;

async function runBatchedLoad() {
    let pool;
    try {
        pool = await getConnection();
        let totalInserted = 0;

        while (true) {
            console.log(`[LOAD] Inserting next batch of ${BATCH_SIZE}...`);

            // We use NOT EXISTS to avoid duplicates and allow restartability.
            // Using WITH CTE for deduplication within the batch is complex with TOP.
            // Better strategy: Select TOP N from Source that are NOT in Target.
            // But checking NOT IN Target for every row is expensive if Target grows.
            // A better way for initial load:
            // ORDER BY FechaModificacionIT and keep track of last inserted timestamp?
            // Yes, "Keyset Pagination" or "Seek Method".
            // But we have duplicates in source 'Ticket'.

            // Let's use the straightforward WHERE NOT EXISTS approach first.
            // SQL Server is smart enough to use Index on SIATC.Tickets.Ticket.

            const result = await pool.request().query(`
                WITH RankedSource AS (
                    SELECT 
                        TRIM(Ticket) as Ticket, TRIM(LlamadaFSM) as LlamadaFSM, TRIM(IdServicio) as IdServicio, TRIM(IdCliente) as IdCliente, TRIM(IDEmpresa) as IDEmpresa,
                        TRIM(Estado) as Estado, TRY_CAST(FechaVisita AS DATETIME) as FechaVisita, TRY_CAST(FechaUltimaModificacion AS DATETIME) as FechaUltimaModificacion,
                        TRIM(NombreCliente) as NombreCliente, TRIM(CodigoExternoCliente) as CodigoExternoCliente, TRIM(Email) as Email,
                        TRIM(Celular1) as Celular1, TRIM(Celular2) as Celular2, TRIM(Telefono1) as Telefono1,
                        TRIM(Calle) as Calle, TRIM(NumeroCalle) as NumeroCalle, TRIM(Distrito) as Distrito, TRIM(Ciudad) as Ciudad, TRIM(Pais) as Pais, TRIM(CodigoPostal) as CodigoPostal,
                        TRY_CAST(REPLACE(Latitud, ',', '.') AS DECIMAL(10, 7)) as Latitud,
                        TRY_CAST(REPLACE(Longitud, ',', '.') AS DECIMAL(10, 7)) as Longitud,
                        TRIM(Referencia) as Referencia,
                        TRIM(IdEquipo) as IdEquipo, TRIM(NombreEquipo) as NombreEquipo, TRIM(CodigoExternoEquipo) as CodigoExternoEquipo, TRIM(Asunto) as Asunto,
                        TRIM(CodigoTecnico) as CodigoTecnico, TRIM(NombreTecnico) as NombreTecnico, TRIM(ApellidoTecnico) as ApellidoTecnico,
                        CASE WHEN LOWER(TRIM(VisitaRealizada)) IN ('true','1','si','yes') THEN 1 ELSE 0 END as VisitaRealizada,
                        CASE WHEN LOWER(TRIM(TrabajoRealizado)) IN ('true','1','si','yes') THEN 1 ELSE 0 END as TrabajoRealizado,
                        CASE WHEN LOWER(TRIM(SolicitaNuevaVisita)) IN ('true','1','si','yes') THEN 1 ELSE 0 END as SolicitaNuevaVisita,
                        TRIM(MotivoNuevaVisita) as MotivoNuevaVisita, TRIM(CodMotivoIncidente) as CodMotivoIncidente,
                        TRIM(ComentarioProgramador) as ComentarioProgramador, TRIM(ComentarioTecnico) as ComentarioTecnico,
                        TRY_CAST(CheckOut AS DATETIME) as CheckOut, TRY_CAST(FechaModificacionIT AS DATETIME) as FechaModificacionIT,
                        ROW_NUMBER() OVER (PARTITION BY TRIM(Ticket) ORDER BY TRY_CAST(FechaModificacionIT AS DATETIME) DESC) as RowNum
                    FROM [APPGAC].[Servicios]
                )
                INSERT INTO [SIATC].[Tickets] (
                    Ticket, LlamadaFSM, IdServicio, IdCliente, IDEmpresa,
                    Estado, FechaVisita, FechaUltimaModificacion,
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
                SELECT TOP (${BATCH_SIZE})
                    Ticket, LlamadaFSM, IdServicio, IdCliente, IDEmpresa,
                    Estado, FechaVisita, FechaUltimaModificacion,
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
                FROM RankedSource
                WHERE RowNum = 1 
                  AND Ticket NOT IN (SELECT Ticket FROM [SIATC].[Tickets])
            `);

            const rowsAffected = result.rowsAffected[0];
            totalInserted += rowsAffected;
            console.log(`[LOAD] Inserted ${rowsAffected} rows. Total: ${totalInserted}`);

            if (rowsAffected === 0) {
                console.log('[LOAD] No more rows to insert (or batch empty). Finished.');
                break;
            }

            // Optional: Small delay to let DB breathe
            await new Promise(r => setTimeout(r, 100));
        }

        process.exit(0);
    } catch (err) {
        console.error('[LOAD] Error:', err);
        process.exit(1);
    }
}

runBatchedLoad();
