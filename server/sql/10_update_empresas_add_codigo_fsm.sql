-- ===================================================================
-- Script: Actualizar tabla Empresas con CodigoFSM y NombreEmpresa
-- Propósito: Separar código FSM del nombre real de empresa
-- Fecha: 2026-02-11
-- ===================================================================

PRINT '========================================';
PRINT 'ACTUALIZAR ESTRUCTURA DE EMPRESAS';
PRINT '========================================';

-- Paso 1: Agregar nueva columna CodigoFSM
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[SIATC].[Empresas]') AND name = 'CodigoFSM')
BEGIN
    ALTER TABLE [SIATC].[Empresas]
    ADD CodigoFSM NVARCHAR(50) NULL;
    PRINT '✓ Columna CodigoFSM agregada';
END
ELSE
BEGIN
    PRINT '⚠ Columna CodigoFSM ya existe';
END
GO

-- Paso 2: Copiar datos de NombreEmpresa a CodigoFSM
UPDATE [SIATC].[Empresas]
SET CodigoFSM = NombreEmpresa
WHERE CodigoFSM IS NULL;
PRINT '✓ Datos copiados de NombreEmpresa a CodigoFSM';
GO

-- Paso 3: Actualizar NombreEmpresa con nombres reales (placeholder)
-- SOLE mantiene su nombre
UPDATE [SIATC].[Empresas]
SET NombreEmpresa = 'SOLE - Grupo Industrial'
WHERE CodigoFSM = 'SOLE';

-- Para las demás empresas, usar CodigoFSM como nombre temporal
-- El usuario deberá actualizar con nombres reales después
UPDATE [SIATC].[Empresas]
SET NombreEmpresa = 'Empresa ' + CodigoFSM
WHERE TipoEmpresa = 'CAS';

PRINT '✓ Nombres de empresas actualizados (usar nombres reales después)';
GO

-- Paso 4: Hacer CodigoFSM NOT NULL y UNIQUE
ALTER TABLE [SIATC].[Empresas]
ALTER COLUMN CodigoFSM NVARCHAR(50) NOT NULL;
PRINT '✓ CodigoFSM configurado como NOT NULL';
GO

-- Crear índice único en CodigoFSM
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_Empresas_CodigoFSM')
BEGIN
    ALTER TABLE [SIATC].[Empresas]
    ADD CONSTRAINT UQ_Empresas_CodigoFSM UNIQUE (CodigoFSM);
    PRINT '✓ Constraint UNIQUE agregado a CodigoFSM';
END
GO

-- Paso 5: Actualizar índice de NombreEmpresa (ya no necesita ser único)
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ__Empresas__' AND object_id = OBJECT_ID('[SIATC].[Empresas]'))
BEGIN
    DECLARE @constraintName NVARCHAR(200);
    SELECT @constraintName = name 
    FROM sys.indexes 
    WHERE object_id = OBJECT_ID('[SIATC].[Empresas]') 
        AND is_unique = 1 
        AND name LIKE '%NombreEmpresa%';
    
    IF @constraintName IS NOT NULL
    BEGIN
        DECLARE @sql NVARCHAR(500) = 'ALTER TABLE [SIATC].[Empresas] DROP CONSTRAINT ' + @constraintName;
        EXEC sp_executesql @sql;
        PRINT '✓ Constraint UNIQUE removido de NombreEmpresa';
    END
END
GO

-- Crear índice normal en NombreEmpresa (para búsquedas)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Empresas_NombreEmpresa_v2')
BEGIN
    CREATE INDEX IX_Empresas_NombreEmpresa_v2 ON [SIATC].[Empresas](NombreEmpresa);
    PRINT '✓ Índice creado en NombreEmpresa';
END
GO

-- Verificar estructura final
PRINT '';
PRINT '========================================';
PRINT 'ESTRUCTURA FINAL DE EMPRESAS';
PRINT '========================================';
SELECT 
    IdEmpresa,
    CodigoFSM,
    NombreEmpresa,
    TipoEmpresa,
    Activo
FROM [SIATC].[Empresas]
ORDER BY 
    CASE WHEN TipoEmpresa = 'PROPIA' THEN 0 ELSE 1 END,
    CodigoFSM;
GO

PRINT '';
PRINT '========================================';
PRINT '✓ ACTUALIZACIÓN COMPLETADA';
PRINT '========================================';
PRINT '';
PRINT '📝 NOTA IMPORTANTE:';
PRINT '   Actualizar nombres reales de empresas CAS con:';
PRINT '   UPDATE [SIATC].[Empresas] SET NombreEmpresa = ''Nombre Real'' WHERE CodigoFSM = ''1301''';
PRINT '';
