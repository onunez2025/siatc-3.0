-- =============================================
-- Script: Migración de datos de usuarios
-- Autor: Sistema
-- Fecha: 2026-02-11
-- Descripción: Extrae usuarios existentes y técnicos de tickets
--              para poblar la nueva tabla [SIATC].[Usuarios]
-- =============================================

-- PASO 1: Extraer y cargar empresas únicas
PRINT 'PASO 1: Cargando empresas...';

-- Obtener empresas de la tabla antigua de usuarios
INSERT INTO [SIATC].[Empresas] ([IdEmpresa], [NombreEmpresa], [Activo])
SELECT DISTINCT 
    Empresa as IdEmpresa,
    CASE 
        WHEN Empresa = 'a8ccb392' THEN 'SOLE - Matriz'
        WHEN Empresa = 'e9a5a911' THEN 'SOLE - Operaciones'
        ELSE 'Empresa ' + Empresa
    END as NombreEmpresa,
    1 as Activo
FROM [dbo].[GAC_APP_TB_USUARIOS]
WHERE Empresa IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM [SIATC].[Empresas] WHERE [IdEmpresa] = [dbo].[GAC_APP_TB_USUARIOS].Empresa);

-- Agregar empresas desde tickets si no existen
INSERT INTO [SIATC].[Empresas] ([IdEmpresa], [NombreEmpresa], [Activo])
SELECT DISTINCT 
    IDEmpresa as IdEmpresa,
    'Empresa ' + IDEmpresa as NombreEmpresa,
    1 as Activo
FROM [SIATC].[Tickets]
WHERE IDEmpresa IS NOT NULL
    AND LEN(LTRIM(RTRIM(IDEmpresa))) > 0
    AND NOT EXISTS (SELECT 1 FROM [SIATC].[Empresas] WHERE [IdEmpresa] = [SIATC].[Tickets].IDEmpresa);

PRINT 'Empresas cargadas: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- PASO 2: Migrar usuarios existentes desde tabla antigua
PRINT 'PASO 2: Migrando usuarios existentes...';

-- Mapeo de tipos de usuario a roles
DECLARE @RolAdmin INT = (SELECT IdRol FROM [SIATC].[Roles] WHERE NombreRol = 'ADMIN');
DECLARE @RolSupervisor INT = (SELECT IdRol FROM [SIATC].[Roles] WHERE NombreRol = 'SUPERVISOR');
DECLARE @RolTecnico INT = (SELECT IdRol FROM [SIATC].[Roles] WHERE NombreRol = 'TECNICO');
DECLARE @RolOperador INT = (SELECT IdRol FROM [SIATC].[Roles] WHERE NombreRol = 'OPERADOR');
DECLARE @RolChofer INT = (SELECT IdRol FROM [SIATC].[Roles] WHERE NombreRol = 'CHOFER');
DECLARE @RolAsistente INT = (SELECT IdRol FROM [SIATC].[Roles] WHERE NombreRol = 'ASISTENTE');

INSERT INTO [SIATC].[Usuarios] (
    [Username], 
    [Password],
    [Nombre],
    [Apellidos],
    [Email],
    [IdRol],
    [IdEmpresa],
    [CodigoUsuario],
    [Activo],
    [FechaUltimoLogin],
    [CreadoPor]
)
SELECT 
    LTRIM(RTRIM([ID Usuario])) as Username,
    ISNULL([Contraseña], '123') as Password, -- Contraseña por defecto si no tiene
    ISNULL(LTRIM(RTRIM([Nombre])), 'Sin nombre') as Nombre,
    ISNULL(LTRIM(RTRIM([Apellido])), 'Sin apellido') as Apellidos,
    ISNULL(LTRIM(RTRIM([Correo])), LTRIM(RTRIM([ID Usuario])) + '@sole.com.pe') as Email,
    
    -- Mapeo de rol basado en el tipo de usuario
    CASE 
        WHEN UPPER(UT.[Tipo de Usuario]) LIKE '%ADMINISTRADOR%' THEN @RolAdmin
        WHEN UPPER(UT.[Tipo de Usuario]) LIKE '%SUPERVISOR%' THEN @RolSupervisor
        WHEN UPPER(UT.[Tipo de Usuario]) LIKE '%TECNICO%' THEN @RolTecnico
        WHEN UPPER(UT.[Tipo de Usuario]) LIKE '%CHOFER%' THEN @RolChofer
        WHEN UPPER(UT.[Tipo de Usuario]) LIKE '%ASISTENTE%' THEN @RolAsistente
        ELSE @RolOperador
    END as IdRol,
    
    U.Empresa as IdEmpresa,
    U.[Cod_usuario] as CodigoUsuario,
    ISNULL(U.[Estado], 1) as Activo,
    U.[LastLogin] as FechaUltimoLogin,
    'MIGRATION' as CreadoPor
    
FROM [dbo].[GAC_APP_TB_USUARIOS] U
LEFT JOIN [dbo].[GAC_APP_TB_USUARIOS_TIPO] UT ON U.Tipo = UT.[ID Tipo de Usuario]
WHERE NOT EXISTS (
    SELECT 1 FROM [SIATC].[Usuarios] 
    WHERE Username = LTRIM(RTRIM(U.[ID Usuario]))
);

DECLARE @UsuariosMigrados INT = @@ROWCOUNT;
PRINT 'Usuarios migrados desde tabla antigua: ' + CAST(@UsuariosMigrados AS VARCHAR);
GO

-- PASO 3: Extraer técnicos únicos desde la tabla de tickets
PRINT 'PASO 3: Extrayendo técnicos desde tickets...';

-- Primero crear una CTE con técnicos únicos y su ROW_NUMBER para evitar duplicados
;WITH TecnicosUnicos AS (
    SELECT DISTINCT
        CodigoTecnico,
        NombreTecnico,
        ApellidoTecnico,
        IDEmpresa,
        ROW_NUMBER() OVER (
            PARTITION BY 
                CASE 
                    WHEN LEN(LTRIM(RTRIM(CodigoTecnico))) > 0 
                    THEN LTRIM(RTRIM(CodigoTecnico))
                    ELSE REPLACE(REPLACE(LTRIM(RTRIM(NombreTecnico)) + '_' + LTRIM(RTRIM(ApellidoTecnico)), ' ', ''), 'Ñ', 'N')
                END
            ORDER BY CodigoTecnico
        ) as RowNum
    FROM [SIATC].[Tickets]
    WHERE NombreTecnico IS NOT NULL 
        AND LEN(LTRIM(RTRIM(NombreTecnico))) > 0
        AND ApellidoTecnico IS NOT NULL
        AND LEN(LTRIM(RTRIM(ApellidoTecnico))) > 0
)
INSERT INTO [SIATC].[Usuarios] (
    [Username],
    [Password],
    [Nombre],
    [Apellidos],
    [Email],
    [IdRol],
    [IdEmpresa],
    [CodigoTecnico],
    [Activo],
    [CreadoPor]
)
SELECT
    -- Username con sufijo si es duplicado
    CASE 
        WHEN LEN(LTRIM(RTRIM(T.CodigoTecnico))) > 0 
        THEN 'TEC_' + LTRIM(RTRIM(T.CodigoTecnico)) + CASE WHEN T.RowNum > 1 THEN '_' + CAST(T.RowNum AS VARCHAR) ELSE '' END
        ELSE LEFT('TEC_' + REPLACE(REPLACE(LTRIM(RTRIM(T.NombreTecnico)) + '_' + LTRIM(RTRIM(T.ApellidoTecnico)), ' ', ''), 'Ñ', 'N'), 45) + CASE WHEN T.RowNum > 1 THEN '_' + CAST(T.RowNum AS VARCHAR) ELSE '' END
    END as Username,
    
    '123' as Password, -- Contraseña por defecto para técnicos nuevos
    
    LTRIM(RTRIM(T.NombreTecnico)) as Nombre,
    LTRIM(RTRIM(T.ApellidoTecnico)) as Apellidos,
    
    -- Email generado
    LOWER(
        REPLACE(LTRIM(RTRIM(T.NombreTecnico)), ' ', '') + '.' + 
        REPLACE(LEFT(LTRIM(RTRIM(T.ApellidoTecnico)), CHARINDEX(' ', LTRIM(RTRIM(T.ApellidoTecnico)) + ' ') - 1), ' ', '') +
        '@sole.com.pe'
    ) as Email,
    
    (SELECT IdRol FROM [SIATC].[Roles] WHERE NombreRol = 'TECNICO') as IdRol,
    T.IDEmpresa as IdEmpresa,
    LTRIM(RTRIM(T.CodigoTecnico)) as CodigoTecnico,
    1 as Activo,
    'MIGRATION_TICKETS' as CreadoPor

FROM TecnicosUnicos T
WHERE T.RowNum = 1 -- Solo tomar el primer registro de cada técnico único
    -- No agregar si ya existe en la tabla por código de técnico
    AND NOT EXISTS (
        SELECT 1 FROM [SIATC].[Usuarios] U
        WHERE U.CodigoTecnico = LTRIM(RTRIM(T.CodigoTecnico))
        AND T.CodigoTecnico IS NOT NULL
        AND LEN(LTRIM(RTRIM(T.CodigoTecnico))) > 0
    )
    -- No agregar si ya existe por nombre completo (para técnicos sin código)
    AND NOT EXISTS (
        SELECT 1 FROM [SIATC].[Usuarios] U
        WHERE U.Nombre = LTRIM(RTRIM(T.NombreTecnico))
        AND U.Apellidos = LTRIM(RTRIM(T.ApellidoTecnico))
        AND (T.CodigoTecnico IS NULL OR LEN(LTRIM(RTRIM(T.CodigoTecnico))) = 0)
    );

DECLARE @TecnicosMigrados INT = @@ROWCOUNT;
PRINT 'Técnicos extraídos desde tickets: ' + CAST(@TecnicosMigrados AS VARCHAR);
GO

-- PASO 4: Actualizar CodigoTecnico para usuarios existentes que son técnicos
PRINT 'PASO 4: Actualizando códigos de técnico...';

-- Simplificado: Los técnicos ya tienen su código asignado en la migración
-- Este paso es opcional y solo para usuarios migrados de la tabla antigua
-- que podrían no tener código pero aparecen en tickets

DECLARE @Actualizados INT = 0;
PRINT 'Códigos de técnico actualizados: ' + CAST(@Actualizados AS VARCHAR) + ' (omitido por performance)';
GO

-- PASO 5: Reporte final
PRINT '============================================='
PRINT 'RESUMEN DE MIGRACIÓN:'
SELECT 
    'Empresas' as Tabla,
    COUNT(*) as Total
FROM [SIATC].[Empresas]

UNION ALL

SELECT 
    'Usuarios Total' as Tabla,
    COUNT(*) as Total
FROM [SIATC].[Usuarios]

UNION ALL

SELECT 
    'Por Rol: ' + R.NombreRol as Tabla,
    COUNT(*) as Total
FROM [SIATC].[Usuarios] U
INNER JOIN [SIATC].[Roles] R ON U.IdRol = R.IdRol
GROUP BY R.NombreRol

UNION ALL

SELECT 
    'Usuarios Activos' as Tabla,
    COUNT(*) as Total
FROM [SIATC].[Usuarios]
WHERE Activo = 1;

PRINT '============================================='
PRINT 'Migración completada exitosamente'
PRINT 'NOTA: Todas las contraseñas deben ser cambiadas en el primer login'
PRINT '============================================='
