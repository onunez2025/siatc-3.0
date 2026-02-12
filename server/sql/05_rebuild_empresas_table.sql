-- ===================================================================
-- Script: Recrear tabla Empresas con TipoEmpresa
-- Propósito: Definir empresas PROPIAS (SOLE) vs CAS (clientes)
-- Fecha: 2026-02-11
-- ===================================================================

-- Eliminar tabla existente si existe
IF OBJECT_ID('[SIATC].[Empresas]', 'U') IS NOT NULL
BEGIN
    DROP TABLE [SIATC].[Empresas];
    PRINT 'Tabla [SIATC].[Empresas] eliminada.';
END
GO

-- Crear tabla Empresas con estructura nueva
CREATE TABLE [SIATC].[Empresas] (
    IdEmpresa INT IDENTITY(1,1) PRIMARY KEY,
    NombreEmpresa NVARCHAR(100) NOT NULL UNIQUE, -- Nombre único de empresa
    TipoEmpresa VARCHAR(10) NOT NULL CHECK (TipoEmpresa IN ('PROPIA', 'CAS')), -- PROPIA = SOLE, CAS = clientes
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    FechaModificacion DATETIME NULL
);

PRINT 'Tabla [SIATC].[Empresas] creada exitosamente.';
GO

-- Crear índice para búsquedas por nombre
CREATE INDEX IX_Empresas_NombreEmpresa ON [SIATC].[Empresas](NombreEmpresa);
GO

-- Crear índice para filtrar por tipo
CREATE INDEX IX_Empresas_TipoEmpresa ON [SIATC].[Empresas](TipoEmpresa);
GO

PRINT '✓ Script completado: Tabla Empresas lista para ser poblada.';
