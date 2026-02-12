-- ===================================================================
-- Script: Recrear tabla Usuarios limpia con estructura actualizada
-- Propósito: Tabla de usuarios con IdEmpresa en lugar de TipoEmpresa
-- Fecha: 2026-02-11
-- ===================================================================

-- Eliminar tabla existente si existe
IF OBJECT_ID('[SIATC].[Usuarios]', 'U') IS NOT NULL
BEGIN
    DROP TABLE [SIATC].[Usuarios];
    PRINT 'Tabla [SIATC].[Usuarios] eliminada (779 usuarios antiguos).';
END
GO

-- Crear tabla Usuarios con estructura actualizada
CREATE TABLE [SIATC].[Usuarios] (
    IdUsuario INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL, -- Almacenará hash bcrypt
    Nombre NVARCHAR(100) NULL,
    Apellido NVARCHAR(100) NULL,
    Email NVARCHAR(100) NULL,
    
    -- Relación con Empresa (no tipo directamente)
    IdEmpresa INT NOT NULL,
    FOREIGN KEY (IdEmpresa) REFERENCES [SIATC].[Empresas](IdEmpresa),
    
    -- Relación con Rol
    IdRol INT NOT NULL,
    FOREIGN KEY (IdRol) REFERENCES [SIATC].[Roles](IdRol),
    
    -- Código de técnico (solo para rol TECNICO)
    CodigoTecnico NVARCHAR(20) NULL,
    
    -- Control de estado
    Activo BIT NOT NULL DEFAULT 1,
    RequiereCambioPassword BIT NOT NULL DEFAULT 1, -- Forzar cambio en primer login
    
    -- Auditoría
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    FechaModificacion DATETIME NULL,
    UltimoLogin DATETIME NULL
);

PRINT 'Tabla [SIATC].[Usuarios] creada exitosamente.';
GO

-- Índices para mejorar rendimiento
CREATE INDEX IX_Usuarios_IdEmpresa ON [SIATC].[Usuarios](IdEmpresa);
CREATE INDEX IX_Usuarios_IdRol ON [SIATC].[Usuarios](IdRol);
CREATE INDEX IX_Usuarios_CodigoTecnico ON [SIATC].[Usuarios](CodigoTecnico);
CREATE INDEX IX_Usuarios_Activo ON [SIATC].[Usuarios](Activo);
GO

PRINT '✓ Script completado: Tabla Usuarios lista para recibir nuevos usuarios.';
PRINT '⚠ Tabla vacía - Los usuarios deben ser creados manualmente o mediante script de población.';
