-- ===================================================================
-- Script: Limpiar tablas de usuarios existentes (DROP seguro)
-- Propósito: Eliminar foreign keys y tablas en orden correcto
-- Fecha: 2026-02-11
-- ===================================================================

PRINT '========================================';
PRINT 'LIMPIEZA DE TABLAS EXISTENTES';
PRINT '========================================';

-- Paso 1: Eliminar tabla Usuarios (tiene FKs hacia Empresas y Roles)
IF OBJECT_ID('[SIATC].[Usuarios]', 'U') IS NOT NULL
BEGIN
    DROP TABLE [SIATC].[Usuarios];
    PRINT '✓ Tabla [SIATC].[Usuarios] eliminada';
END
ELSE
BEGIN
    PRINT '⚠ Tabla [SIATC].[Usuarios] no existe';
END
GO

-- Paso 2: Eliminar tabla Roles
IF OBJECT_ID('[SIATC].[Roles]', 'U') IS NOT NULL
BEGIN
    DROP TABLE [SIATC].[Roles];
    PRINT '✓ Tabla [SIATC].[Roles] eliminada';
END
ELSE
BEGIN
    PRINT '⚠ Tabla [SIATC].[Roles] no existe';
END
GO

-- Paso 3: Eliminar tabla Empresas
IF OBJECT_ID('[SIATC].[Empresas]', 'U') IS NOT NULL
BEGIN
    DROP TABLE [SIATC].[Empresas];
    PRINT '✓ Tabla [SIATC].[Empresas] eliminada';
END
ELSE
BEGIN
    PRINT '⚠ Tabla [SIATC].[Empresas] no existe';
END
GO

PRINT '';
PRINT '✓ Limpieza completada - Listo para crear tablas nuevas';
