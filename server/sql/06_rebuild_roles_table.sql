-- ===================================================================
-- Script: Recrear tabla Roles con 7 roles del sistema
-- Propósito: Definir roles de usuario actualizados
-- Fecha: 2026-02-11
-- ===================================================================

-- Eliminar tabla existente si existe
IF OBJECT_ID('[SIATC].[Roles]', 'U') IS NOT NULL
BEGIN
    DROP TABLE [SIATC].[Roles];
    PRINT 'Tabla [SIATC].[Roles] eliminada.';
END
GO

-- Crear tabla Roles
CREATE TABLE [SIATC].[Roles] (
    IdRol INT IDENTITY(1,1) PRIMARY KEY,
    NombreRol NVARCHAR(50) NOT NULL UNIQUE,
    Descripcion NVARCHAR(200) NULL,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE()
);

PRINT 'Tabla [SIATC].[Roles] creada exitosamente.';
GO

-- Insertar los 7 roles del sistema
INSERT INTO [SIATC].[Roles] (NombreRol, Descripcion) VALUES
('ADMINISTRADOR', 'Acceso completo al sistema, gestión de usuarios y configuración'),
('TECNICO', 'Técnico de campo, solo ve tickets asignados a su código'),
('SUPERVISOR_TECNICO', 'Supervisor de técnicos, gestión de equipo técnico'),
('ASESOR', 'Asesor comercial o de servicio al cliente'),
('SUPERVISOR_ASESOR', 'Supervisor de asesores, gestión de equipo comercial'),
('ASISTENTE_ADMIN', 'Asistente administrativo, soporte operativo'),
('INVITADO', 'Acceso de solo lectura, sin permisos de modificación');

PRINT '✓ 7 roles insertados exitosamente.';
GO

-- Verificar inserción
SELECT 
    IdRol,
    NombreRol,
    Descripcion,
    Activo
FROM [SIATC].[Roles]
ORDER BY IdRol;
GO

PRINT '✓ Script completado: Tabla Roles lista con 7 roles.';
