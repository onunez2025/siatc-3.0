-- ===================================================================
-- Script: Actualizar nombres reales de empresas CAS
-- Propósito: Cambiar placeholders por nombres reales de empresas
-- Fecha: 2026-02-11
-- ===================================================================

-- INSTRUCCIONES:
-- 1. Identificar el CodigoFSM de cada empresa en la tabla
-- 2. Actualizar con el nombre real de la empresa
-- 3. Ejecutar este script

PRINT '========================================';
PRINT 'ACTUALIZAR NOMBRES DE EMPRESAS CAS';
PRINT '========================================';

-- Ejemplo: Actualizar empresas conocidas
-- Reemplazar con los nombres reales según tu conocimiento

-- SOLE ya está configurado correctamente
UPDATE [SIATC].[Empresas]
SET NombreEmpresa = 'SOLE - Grupo Industrial'
WHERE CodigoFSM = 'SOLE';

-- Ejemplos de actualización para empresas CAS:
-- Descomentar y modificar según empresas reales

/*
UPDATE [SIATC].[Empresas]
SET NombreEmpresa = 'Ripley'
WHERE CodigoFSM = '1301';

UPDATE [SIATC].[Empresas]
SET NombreEmpresa = 'Saga Falabella'
WHERE CodigoFSM = '1302EXT';

UPDATE [SIATC].[Empresas]
SET NombreEmpresa = 'Oechsle'
WHERE CodigoFSM = '1303EXT';

-- Agregar más empresas según necesites...
*/

PRINT '✓ Nombres de empresas actualizados';
GO

-- Mostrar resultado
PRINT '';
PRINT 'Empresas actualizadas:';
SELECT 
    IdEmpresa,
    CodigoFSM,
    NombreEmpresa,
    TipoEmpresa
FROM [SIATC].[Empresas]
ORDER BY 
    CASE WHEN TipoEmpresa = 'PROPIA' THEN 0 ELSE 1 END,
    CodigoFSM;
GO

PRINT '';
PRINT '========================================';
PRINT 'NOTAS:';
PRINT '  1. CodigoFSM NO debe cambiar (usado para matching)';
PRINT '  2. NombreEmpresa es para visualización en UI';
PRINT '  3. Usuarios verán el NombreEmpresa en su perfil';
PRINT '========================================';
