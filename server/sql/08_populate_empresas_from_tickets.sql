-- ===================================================================
-- Script: Poblar tabla Empresas desde tickets existentes
-- Propósito: Extraer empresas únicas de [SIATC].[Tickets] y clasificarlas
-- Fecha: 2026-02-11
-- ===================================================================

-- Insertar SOLE como empresa PROPIA primero
IF NOT EXISTS (SELECT 1 FROM [SIATC].[Empresas] WHERE NombreEmpresa = 'SOLE')
BEGIN
    INSERT INTO [SIATC].[Empresas] (NombreEmpresa, TipoEmpresa)
    VALUES ('SOLE', 'PROPIA');
    PRINT '✓ SOLE insertado como empresa PROPIA.';
END
GO

-- Insertar todas las demás empresas únicas de Tickets como CAS
INSERT INTO [SIATC].[Empresas] (NombreEmpresa, TipoEmpresa)
SELECT DISTINCT
    IDEmpresa AS NombreEmpresa,
    'CAS' AS TipoEmpresa
FROM [SIATC].[Tickets]
WHERE IDEmpresa IS NOT NULL
    AND IDEmpresa != ''
    AND IDEmpresa != 'SOLE' -- Excluir SOLE (ya insertado)
    AND NOT EXISTS (
        SELECT 1 
        FROM [SIATC].[Empresas] E 
        WHERE E.NombreEmpresa = [SIATC].[Tickets].IDEmpresa
    )
ORDER BY IDEmpresa;
GO

-- Verificar resultados
PRINT '========================================';
PRINT 'RESUMEN DE EMPRESAS INSERTADAS:';
PRINT '========================================';

SELECT 
    TipoEmpresa,
    COUNT(*) AS Total
FROM [SIATC].[Empresas]
GROUP BY TipoEmpresa;
GO

PRINT '';
PRINT 'Top 10 empresas CAS:';
SELECT TOP 10
    IdEmpresa,
    NombreEmpresa,
    TipoEmpresa
FROM [SIATC].[Empresas]
WHERE TipoEmpresa = 'CAS'
ORDER BY NombreEmpresa;
GO

PRINT '';
PRINT '✓ Script completado: Tabla Empresas poblada desde tickets.';
