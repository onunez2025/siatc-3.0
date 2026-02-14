-- 1. Tabla: Maestro de Motivos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[SIATC].[Maestro_Motivos]') AND type in (N'U'))
BEGIN
    CREATE TABLE [SIATC].[Maestro_Motivos](
        [IdMotivo] [int] IDENTITY(1,1) NOT NULL,
        [Tipo] [varchar](20) NOT NULL, -- 'CANCELACION', 'GARANTIA', 'VIP'
        [Descripcion] [nvarchar](100) NOT NULL,
        [Activo] [bit] NOT NULL DEFAULT 1,
        CONSTRAINT [PK_Maestro_Motivos] PRIMARY KEY CLUSTERED ([IdMotivo] ASC)
    );
    PRINT 'Tabla [SIATC].[Maestro_Motivos] creada.';
    
    -- Insertar datos semilla
    INSERT INTO [SIATC].[Maestro_Motivos] (Tipo, Descripcion) VALUES 
    ('CANCELACION', 'Cliente no se encuentra'),
    ('CANCELACION', 'Dirección incorrecta'),
    ('CANCELACION', 'Repuesto no disponible'),
    ('GARANTIA', 'Falla de fábrica'),
    ('GARANTIA', 'Reparación fallida'),
    ('CASO_ESPECIAL', 'Cliente VIP'),
    ('CASO_ESPECIAL', 'Reclamo Indecopi'),
    ('NOTA_CREDITO', 'Devolución de producto'),
    ('NOTA_CREDITO', 'Error en facturación');
END
GO

-- 2. Tabla: Solicitudes
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[SIATC].[Solicitudes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [SIATC].[Solicitudes](
        [IdSolicitud] [int] IDENTITY(1,1) NOT NULL,
        [Ticket] [nvarchar](50) NOT NULL, -- FK logicamente a Tickets (que puede ser nvarchar)
        [TipoSolicitud] [varchar](20) NOT NULL, -- 'GARANTIA', 'NOTA_CREDITO', 'CANCELACION', 'CASO_ESPECIAL'
        [Estado] [varchar](20) NOT NULL DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'APROBADO', 'RECHAZADO', 'OBSERVADO'
        [SolicitanteId] [int] NOT NULL,
        [FechaSolicitud] [datetime] NOT NULL DEFAULT GETDATE(),
        [MotivoId] [int] NULL,
        [Justificacion] [nvarchar](max) NULL,
        [AprobadorId] [int] NULL,
        [IdEquipo] [varchar](50) NULL,
        CONSTRAINT [PK_Solicitudes] PRIMARY KEY CLUSTERED ([IdSolicitud] ASC)
    );
    -- FKs opcionales dependiendo de si las tablas existen y tipos coinciden exactamente
    -- ALTER TABLE [SIATC].[Solicitudes] ADD CONSTRAINT [FK_Solicitudes_Usuarios] FOREIGN KEY([SolicitanteId]) REFERENCES [SIATC].[Usuarios] ([IdUsuario]);
    
    PRINT 'Tabla [SIATC].[Solicitudes] creada.';
END
GO

-- 3. Tabla: Solicitud_Log (Trazabilidad/SLA)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[SIATC].[Solicitud_Log]') AND type in (N'U'))
BEGIN
    CREATE TABLE [SIATC].[Solicitud_Log](
        [IdLog] [int] IDENTITY(1,1) NOT NULL,
        [IdSolicitud] [int] NOT NULL,
        [EstadoAnterior] [varchar](20) NULL,
        [EstadoNuevo] [varchar](20) NOT NULL,
        [UsuarioId] [int] NOT NULL,
        [FechaHora] [datetime] NOT NULL DEFAULT GETDATE(),
        [Comentario] [nvarchar](max) NULL,
        CONSTRAINT [PK_Solicitud_Log] PRIMARY KEY CLUSTERED ([IdLog] ASC)
    );
    ALTER TABLE [SIATC].[Solicitud_Log]  WITH CHECK ADD  CONSTRAINT [FK_Solicitud_Log_Solicitudes] FOREIGN KEY([IdSolicitud])
    REFERENCES [SIATC].[Solicitudes] ([IdSolicitud]);
    
    PRINT 'Tabla [SIATC].[Solicitud_Log] creada.';
END
GO

-- 4. Tabla: Asignacion_Supervisores
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[SIATC].[Asignacion_Supervisores]') AND type in (N'U'))
BEGIN
    CREATE TABLE [SIATC].[Asignacion_Supervisores](
        [IdAsignacion] [int] IDENTITY(1,1) NOT NULL,
        [TecnicoId] [int] NOT NULL,
        [SupervisorId] [int] NOT NULL,
        [TipoSupervisor] [varchar](20) NOT NULL, -- 'TECNICO', 'ASESOR'
        [FechaAsignacion] [datetime] DEFAULT GETDATE(),
        CONSTRAINT [PK_Asignacion_Supervisores] PRIMARY KEY CLUSTERED ([IdAsignacion] ASC)
    );
    PRINT 'Tabla [SIATC].[Asignacion_Supervisores] creada.';
END
GO
