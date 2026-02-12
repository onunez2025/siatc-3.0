-- =============================================
-- Script: Crear tabla de usuarios con estructura correcta
-- Autor: Sistema
-- Fecha: 2026-02-11
-- Descripción: Tabla [SIATC].[Usuarios] con tipos de datos correctos,
--              relaciones y categorización de roles
-- =============================================

-- 1. Crear tabla de roles
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'SIATC' AND TABLE_NAME = 'Roles')
BEGIN
    CREATE TABLE [SIATC].[Roles] (
        [IdRol] INT IDENTITY(1,1) PRIMARY KEY,
        [NombreRol] NVARCHAR(50) NOT NULL UNIQUE,
        [Descripcion] NVARCHAR(255) NULL,
        [Activo] BIT DEFAULT 1,
        [FechaCreacion] DATETIME2 DEFAULT GETDATE()
    );

    -- Insertar roles base
    INSERT INTO [SIATC].[Roles] ([NombreRol], [Descripcion])
    VALUES 
        ('ADMIN', 'Administrador del sistema con acceso completo'),
        ('SUPERVISOR', 'Supervisor de operaciones con acceso de gestión'),
        ('TECNICO', 'Técnico de campo con acceso a tickets asignados'),
        ('OPERADOR', 'Operador con acceso limitado a consultas'),
        ('CHOFER', 'Chofer con acceso a rutas y tickets'),
        ('ASISTENTE', 'Asistente administrativo con permisos básicos');

    PRINT 'Tabla [SIATC].[Roles] creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla [SIATC].[Roles] ya existe';
END
GO

-- 2. Crear tabla de empresas (si no existe)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'SIATC' AND TABLE_NAME = 'Empresas')
BEGIN
    CREATE TABLE [SIATC].[Empresas] (
        [IdEmpresa] NVARCHAR(50) PRIMARY KEY, -- Usar el mismo formato que IDEmpresa en Tickets
        [NombreEmpresa] NVARCHAR(255) NOT NULL,
        [RUC] VARCHAR(20) NULL,
        [Direccion] NVARCHAR(500) NULL,
        [Telefono] VARCHAR(50) NULL,
        [Email] NVARCHAR(255) NULL,
        [Activo] BIT DEFAULT 1,
        [FechaCreacion] DATETIME2 DEFAULT GETDATE()
    );

    PRINT 'Tabla [SIATC].[Empresas] creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla [SIATC].[Empresas] ya existe';
END
GO

-- 3. Crear tabla principal de usuarios
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'SIATC' AND TABLE_NAME = 'Usuarios')
BEGIN
    CREATE TABLE [SIATC].[Usuarios] (
        -- Identificación primaria
        [IdUsuario] INT IDENTITY(1,1) PRIMARY KEY,
        [Username] NVARCHAR(50) NOT NULL UNIQUE,
        [Password] NVARCHAR(255) NOT NULL, -- Para hash bcrypt

        -- Información personal
        [Nombre] NVARCHAR(100) NOT NULL,
        [Apellidos] NVARCHAR(150) NOT NULL,
        [Email] NVARCHAR(255) NOT NULL,
        [Telefono] NVARCHAR(50) NULL,
        [DNI] VARCHAR(20) NULL,

        -- Relaciones
        [IdRol] INT NOT NULL,
        [IdEmpresa] NVARCHAR(50) NULL,
        
        -- Campos específicos para técnicos
        [CodigoTecnico] VARCHAR(50) NULL, -- Código de técnico de FSM
        [CodigoUsuario] VARCHAR(50) NULL, -- Código de usuario externo
        
        -- Estado y auditoría
        [Activo] BIT DEFAULT 1,
        [PrimerLogin] BIT DEFAULT 1,
        [FechaCreacion] DATETIME2 DEFAULT GETDATE(),
        [FechaModificacion] DATETIME2 DEFAULT GETDATE(),
        [FechaUltimoLogin] DATETIME2 NULL,
        [CreadoPor] NVARCHAR(50) NULL,
        [ModificadoPor] NVARCHAR(50) NULL,

        -- Foreign Keys
        CONSTRAINT [FK_Usuarios_Rol] FOREIGN KEY ([IdRol]) 
            REFERENCES [SIATC].[Roles]([IdRol]),
        CONSTRAINT [FK_Usuarios_Empresa] FOREIGN KEY ([IdEmpresa]) 
            REFERENCES [SIATC].[Empresas]([IdEmpresa])
    );

    -- Índices para búsqueda optimizada
    CREATE NONCLUSTERED INDEX [IX_Usuarios_Email] ON [SIATC].[Usuarios] ([Email]);
    CREATE NONCLUSTERED INDEX [IX_Usuarios_Rol] ON [SIATC].[Usuarios] ([IdRol]);
    CREATE NONCLUSTERED INDEX [IX_Usuarios_Empresa] ON [SIATC].[Usuarios] ([IdEmpresa]);
    CREATE NONCLUSTERED INDEX [IX_Usuarios_CodigoTecnico] ON [SIATC].[Usuarios] ([CodigoTecnico]) WHERE [CodigoTecnico] IS NOT NULL;
    CREATE NONCLUSTERED INDEX [IX_Usuarios_Activo] ON [SIATC].[Usuarios] ([Activo]);

    PRINT 'Tabla [SIATC].[Usuarios] creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla [SIATC].[Usuarios] ya existe';
END
GO

-- 4. Crear vista para compatibilidad con código existente
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_Usuarios' AND SCHEMA_NAME(schema_id) = 'SIATC')
BEGIN
    DROP VIEW [SIATC].[vw_Usuarios];
END
GO

CREATE VIEW [SIATC].[vw_Usuarios]
AS
SELECT 
    U.[IdUsuario],
    U.[Username] as [ID Usuario],
    U.[Password] as [Contraseña],
    U.[Nombre],
    U.[Apellidos] as [Apellido],
    U.[Email] as [Correo],
    U.[Telefono],
    U.[DNI],
    R.[NombreRol] as [Tipo de Usuario],
    R.[IdRol] as [Tipo],
    U.[IdEmpresa] as [Empresa],
    E.[NombreEmpresa],
    U.[CodigoTecnico],
    U.[CodigoUsuario] as [Cod_usuario],
    U.[Activo] as [Estado],
    U.[FechaUltimoLogin] as [LastLogin],
    U.[FechaCreacion],
    U.[FechaModificacion]
FROM [SIATC].[Usuarios] U
INNER JOIN [SIATC].[Roles] R ON U.[IdRol] = R.[IdRol]
LEFT JOIN [SIATC].[Empresas] E ON U.[IdEmpresa] = E.[IdEmpresa];
GO

PRINT 'Vista [SIATC].[vw_Usuarios] creada exitosamente';
PRINT '============================================='
PRINT 'Script ejecutado exitosamente'
PRINT 'Tablas creadas: [SIATC].[Roles], [SIATC].[Empresas], [SIATC].[Usuarios]'
PRINT 'Vista creada: [SIATC].[vw_Usuarios]'
PRINT '============================================='
