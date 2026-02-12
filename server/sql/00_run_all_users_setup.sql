-- =============================================
-- Script: Ejecutar creación y migración de usuarios
-- Autor: Sistema
-- Fecha: 2026-02-11
-- Descripción: Script maestro para ejecutar en orden:
--              1. Creación de tablas
--              2. Migración de datos
-- =============================================

USE [soledb-puntoventa];
GO

PRINT '============================================='
PRINT 'INICIO: Creación de nueva estructura de usuarios'
PRINT 'Fecha: ' + CONVERT(VARCHAR, GETDATE(), 120)
PRINT '============================================='
GO

-- Ejecutar creación de tablas
PRINT ''
PRINT '>>> Ejecutando: 03_create_users_table.sql'
PRINT ''
:r 03_create_users_table.sql
GO

-- Ejecutar migración de datos
PRINT ''
PRINT '>>> Ejecutando: 04_migrate_users_data.sql'
PRINT ''
:r 04_migrate_users_data.sql
GO

PRINT ''
PRINT '============================================='
PRINT 'PROCESO COMPLETADO'
PRINT 'Fecha: ' + CONVERT(VARCHAR, GETDATE(), 120)
PRINT '============================================='
PRINT ''
PRINT 'SIGUIENTE PASO:'
PRINT '- Actualizar backend (server/index.js) para usar [SIATC].[Usuarios]'
PRINT '- Implementar bcrypt para hashing de contraseñas'
PRINT '- Crear endpoint para cambio de contraseña en primer login'
PRINT '============================================='
GO
