-- ===================================================================
-- Script: Crear usuarios de ejemplo para testing
-- Propósito: Poblar usuarios iniciales con diferentes roles y empresas
-- Fecha: 2026-02-11
-- ===================================================================

-- IMPORTANTE: Este script se ejecuta DESPUÉS de rebuild_users_system.js
-- Asume que ya existen: Empresas, Roles, y usuario 'admin'

DECLARE @IdEmpresaSole INT;
DECLARE @IdEmpresaCAS1 INT;
DECLARE @IdRolAdmin INT;
DECLARE @IdRolTecnico INT;
DECLARE @IdRolSupervisorTec INT;
DECLARE @IdRolAsesor INT;

-- Obtener IDs de Empresas
SELECT @IdEmpresaSole = IdEmpresa FROM [SIATC].[Empresas] WHERE NombreEmpresa = 'SOLE';

-- Obtener una empresa CAS de ejemplo (la primera que encuentre)
SELECT TOP 1 @IdEmpresaCAS1 = IdEmpresa 
FROM [SIATC].[Empresas] 
WHERE TipoEmpresa = 'CAS' 
ORDER BY NombreEmpresa;

-- Obtener IDs de Roles
SELECT @IdRolAdmin = IdRol FROM [SIATC].[Roles] WHERE NombreRol = 'ADMINISTRADOR';
SELECT @IdRolTecnico = IdRol FROM [SIATC].[Roles] WHERE NombreRol = 'TECNICO';
SELECT @IdRolSupervisorTec = IdRol FROM [SIATC].[Roles] WHERE NombreRol = 'SUPERVISOR_TECNICO';
SELECT @IdRolAsesor = IdRol FROM [SIATC].[Roles] WHERE NombreRol = 'ASESOR';

PRINT '========================================';
PRINT 'CREAR USUARIOS DE EJEMPLO';
PRINT '========================================';

-- ===================================================================
-- 1. TÉCNICOS DE SOLE
-- ===================================================================
PRINT '';
PRINT '1. Creando Técnicos de SOLE...';

-- Verificar si CCERNA existe en tickets
IF EXISTS (SELECT 1 FROM [SIATC].[Tickets] WHERE CodigoTecnico = 'CCERNA')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [SIATC].[Usuarios] WHERE Username = 'CCERNA')
    BEGIN
        INSERT INTO [SIATC].[Usuarios] (Username, Password, Nombre, Apellido, Email, IdEmpresa, IdRol, CodigoTecnico, Activo, RequiereCambioPassword)
        VALUES ('CCERNA', '123', 'Carlos', 'Cerna', 'ccerna@sole.com', @IdEmpresaSole, @IdRolTecnico, 'CCERNA', 1, 1);
        PRINT '  ✓ CCERNA creado';
    END
END

IF EXISTS (SELECT 1 FROM [SIATC].[Tickets] WHERE CodigoTecnico = 'IZARATE')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [SIATC].[Usuarios] WHERE Username = 'IZARATE')
    BEGIN
        INSERT INTO [SIATC].[Usuarios] (Username, Password, Nombre, Apellido, Email, IdEmpresa, IdRol, CodigoTecnico, Activo, RequiereCambioPassword)
        VALUES ('IZARATE', '123', 'Ivan', 'Zarate', 'izarate@sole.com', @IdEmpresaSole, @IdRolTecnico, 'IZARATE', 1, 1);
        PRINT '  ✓ IZARATE creado';
    END
END

IF EXISTS (SELECT 1 FROM [SIATC].[Tickets] WHERE CodigoTecnico = 'JCRUZ')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [SIATC].[Usuarios] WHERE Username = 'JCRUZ')
    BEGIN
        INSERT INTO [SIATC].[Usuarios] (Username, Password, Nombre, Apellido, Email, IdEmpresa, IdRol, CodigoTecnico, Activo, RequiereCambioPassword)
        VALUES ('JCRUZ', '123', 'Juan', 'Cruz', 'jcruz@sole.com', @IdEmpresaSole, @IdRolTecnico, 'JCRUZ', 1, 1);
        PRINT '  ✓ JCRUZ creado';
    END
END

IF EXISTS (SELECT 1 FROM [SIATC].[Tickets] WHERE CodigoTecnico = 'MVERA')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [SIATC].[Usuarios] WHERE Username = 'MVERA')
    BEGIN
        INSERT INTO [SIATC].[Usuarios] (Username, Password, Nombre, Apellido, Email, IdEmpresa, IdRol, CodigoTecnico, Activo, RequiereCambioPassword)
        VALUES ('MVERA', '123', 'Miguel', 'Vera', 'mvera@sole.com', @IdEmpresaSole, @IdRolTecnico, 'MVERA', 1, 1);
        PRINT '  ✓ MVERA creado';
    END
END

-- ===================================================================
-- 2. SUPERVISOR TÉCNICO DE SOLE
-- ===================================================================
PRINT '';
PRINT '2. Creando Supervisor Técnico de SOLE...';

IF NOT EXISTS (SELECT 1 FROM [SIATC].[Usuarios] WHERE Username = 'supervisor_tec')
BEGIN
    INSERT INTO [SIATC].[Usuarios] (Username, Password, Nombre, Apellido, Email, IdEmpresa, IdRol, Activo, RequiereCambioPassword)
    VALUES ('supervisor_tec', '123', 'Supervisor', 'Técnico', 'supervisor.tec@sole.com', @IdEmpresaSole, @IdRolSupervisorTec, 1, 1);
    PRINT '  ✓ supervisor_tec creado (ve TODOS los tickets)';
END

-- ===================================================================
-- 3. ASESOR DE SOLE
-- ===================================================================
PRINT '';
PRINT '3. Creando Asesor de SOLE...';

IF NOT EXISTS (SELECT 1 FROM [SIATC].[Usuarios] WHERE Username = 'asesor_sole')
BEGIN
    INSERT INTO [SIATC].[Usuarios] (Username, Password, Nombre, Apellido, Email, IdEmpresa, IdRol, Activo, RequiereCambioPassword)
    VALUES ('asesor_sole', '123', 'Asesor', 'Comercial', 'asesor@sole.com', @IdEmpresaSole, @IdRolAsesor, 1, 1);
    PRINT '  ✓ asesor_sole creado (ve TODOS los tickets)';
END

-- ===================================================================
-- 4. USUARIO CAS (si existe empresa CAS)
-- ===================================================================
PRINT '';
PRINT '4. Creando usuario CAS (empresa cliente)...';

IF @IdEmpresaCAS1 IS NOT NULL
BEGIN
    DECLARE @NombreEmpresaCAS NVARCHAR(100);
    SELECT @NombreEmpresaCAS = NombreEmpresa 
    FROM [SIATC].[Empresas] 
    WHERE IdEmpresa = @IdEmpresaCAS1;
    
    DECLARE @UsernameCAS NVARCHAR(50) = 'cas_' + LOWER(REPLACE(@NombreEmpresaCAS, ' ', '_'));
    
    IF NOT EXISTS (SELECT 1 FROM [SIATC].[Usuarios] WHERE Username = @UsernameCAS)
    BEGIN
        INSERT INTO [SIATC].[Usuarios] (Username, Password, Nombre, Apellido, Email, IdEmpresa, IdRol, Activo, RequiereCambioPassword)
        VALUES (@UsernameCAS, '123', 'Usuario', @NombreEmpresaCAS, LOWER(@UsernameCAS) + '@cas.com', @IdEmpresaCAS1, @IdRolAsesor, 1, 1);
        PRINT '  ✓ ' + @UsernameCAS + ' creado (solo ve tickets de ' + @NombreEmpresaCAS + ')';
    END
END
ELSE
BEGIN
    PRINT '  ⚠ No se encontró empresa CAS para crear usuario de ejemplo';
END

-- ===================================================================
-- VERIFICACIÓN FINAL
-- ===================================================================
PRINT '';
PRINT '========================================';
PRINT 'RESUMEN DE USUARIOS CREADOS';
PRINT '========================================';

SELECT 
    U.Username,
    U.Nombre + ' ' + U.Apellido AS NombreCompleto,
    R.NombreRol,
    E.NombreEmpresa,
    E.TipoEmpresa,
    U.CodigoTecnico,
    CASE WHEN U.RequiereCambioPassword = 1 THEN 'Sí' ELSE 'No' END AS RequiereCambio
FROM [SIATC].[Usuarios] U
INNER JOIN [SIATC].[Empresas] E ON U.IdEmpresa = E.IdEmpresa
INNER JOIN [SIATC].[Roles] R ON U.IdRol = R.IdRol
ORDER BY 
    CASE R.NombreRol 
        WHEN 'ADMINISTRADOR' THEN 1
        WHEN 'SUPERVISOR_TECNICO' THEN 2
        WHEN 'TECNICO' THEN 3
        ELSE 4
    END,
    U.Username;

PRINT '';
PRINT '========================================';
PRINT 'CREDENCIALES DE PRUEBA';
PRINT '========================================';
PRINT 'Todos los usuarios tienen password: 123';
PRINT '';
PRINT '📋 TESTING:';
PRINT '  1. admin → Ve TODOS los tickets (PROPIA)';
PRINT '  2. supervisor_tec → Ve TODOS los tickets (PROPIA)';
PRINT '  3. CCERNA, IZARATE, JCRUZ, MVERA → Solo sus tickets asignados';
PRINT '  4. Usuario CAS → Solo tickets de su empresa';
PRINT '';
PRINT '✓ Script completado exitosamente.';
