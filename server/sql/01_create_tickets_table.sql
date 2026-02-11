IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'SIATC')
BEGIN
    EXEC('CREATE SCHEMA [SIATC]')
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'SIATC' AND TABLE_NAME = 'Tickets')
BEGIN
    CREATE TABLE [SIATC].[Tickets] (
        -- Identificadores
        [Ticket] VARCHAR(20) NOT NULL PRIMARY KEY,
        [LlamadaFSM] VARCHAR(20) NULL,
        [IdServicio] VARCHAR(20) NULL,
        [IdCliente] VARCHAR(20) NULL,
        [IDEmpresa] VARCHAR(50) NULL,

        -- Estado y Fechas
        [Estado] NVARCHAR(50) NULL,
        [FechaVisita] DATETIME NULL,
        [FechaUltimaModificacion] DATETIME NULL,
        [LastSync] DATETIME DEFAULT GETDATE(), -- Meta-campo para auditoría

        -- Cliente y Ubicación
        [NombreCliente] NVARCHAR(255) NULL,
        [CodigoExternoCliente] VARCHAR(50) NULL,
        [Email] NVARCHAR(255) NULL,
        [Celular1] VARCHAR(50) NULL,
        [Celular2] VARCHAR(50) NULL,
        [Telefono1] VARCHAR(50) NULL,
        [Calle] NVARCHAR(255) NULL,
        [NumeroCalle] NVARCHAR(50) NULL,
        [Distrito] NVARCHAR(100) NULL,
        [Ciudad] NVARCHAR(100) NULL,
        [Pais] NVARCHAR(100) NULL,
        [CodigoPostal] VARCHAR(20) NULL,
        [Latitud] DECIMAL(10, 7) NULL,
        [Longitud] DECIMAL(10, 7) NULL,
        [Referencia] NVARCHAR(MAX) NULL,

        -- Equipo
        [IdEquipo] VARCHAR(20) NULL,
        [NombreEquipo] NVARCHAR(255) NULL,
        [CodigoExternoEquipo] VARCHAR(50) NULL,
        [Asunto] NVARCHAR(255) NULL,

        -- Técnico y Ejecución
        [CodigoTecnico] VARCHAR(50) NULL,
        [NombreTecnico] NVARCHAR(100) NULL,
        [ApellidoTecnico] NVARCHAR(100) NULL,
        [VisitaRealizada] BIT DEFAULT 0,
        [TrabajoRealizado] BIT DEFAULT 0,
        [SolicitaNuevaVisita] BIT DEFAULT 0,
        [MotivoNuevaVisita] NVARCHAR(255) NULL,
        [CodMotivoIncidente] VARCHAR(50) NULL,

        -- Comentarios
        [ComentarioProgramador] NVARCHAR(MAX) NULL,
        [ComentarioTecnico] NVARCHAR(MAX) NULL,
        [CheckOut] DATETIME NULL,
        [FechaModificacionIT] DATETIME NULL
    );

    -- Índices para Búsqueda Instantánea
    CREATE NONCLUSTERED INDEX [IX_Tickets_Estado] ON [SIATC].[Tickets] ([Estado]);
    CREATE NONCLUSTERED INDEX [IX_Tickets_FechaVisita] ON [SIATC].[Tickets] ([FechaVisita]);
    CREATE NONCLUSTERED INDEX [IX_Tickets_IDEmpresa] ON [SIATC].[Tickets] ([IDEmpresa]);
    CREATE NONCLUSTERED INDEX [IX_Tickets_Cliente] ON [SIATC].[Tickets] ([NombreCliente]);
    CREATE NONCLUSTERED INDEX [IX_Tickets_Tecnico] ON [SIATC].[Tickets] ([NombreTecnico], [ApellidoTecnico]);
END
