# 📋 Migración de Tabla de Usuarios

Este directorio contiene los scripts SQL y herramientas para crear una nueva tabla de usuarios con estructura correcta y tipos de datos apropiados.

## 🎯 Objetivo

Reemplazar la tabla antigua `[dbo].[GAC_APP_TB_USUARIOS]` con una nueva estructura moderna `[SIATC].[Usuarios]` que incluye:

- ✅ Tipos de datos correctos
- ✅ Claves primarias y foráneas
- ✅ Índices optimizados
- ✅ Separación de roles y empresas
- ✅ Campos para auditoría
- ✅ Soporte para hash de contraseñas (bcrypt)

## 📁 Archivos

### Scripts SQL

1. **`03_create_users_table.sql`**
   - Crea tabla `[SIATC].[Roles]` con 6 roles predefinidos
   - Crea tabla `[SIATC].[Empresas]`
   - Crea tabla principal `[SIATC].[Usuarios]` con estructura completa
   - Crea vista `[SIATC].[vw_Usuarios]` para compatibilidad

2. **`04_migrate_users_data.sql`**
   - Migra empresas desde tabla antigua y tickets
   - Migra usuarios existentes con mapeo de roles
   - Extrae técnicos únicos desde tabla de tickets
   - Actualiza códigos de técnico
   - Genera reporte final

3. **`00_run_all_users_setup.sql`**
   - Script maestro que ejecuta los anteriores en orden
   - Útil para SQL Server Management Studio (SSMS)

### Scripts Node.js

4. **`setup_users_db.js`**
   - Ejecuta la migración desde Node.js
   - Procesa batches SQL correctamente
   - Genera reportes detallados
   - Manejo de errores robusto

## 🚀 Cómo Ejecutar

### Opción A: Desde Node.js (Recomendado)

```bash
cd server
node setup_users_db.js
```

### Opción B: Desde SQL Server Management Studio

1. Conectarse a: `soledbserver.database.windows.net`
2. Abrir `03_create_users_table.sql`
3. Ejecutar (F5)
4. Abrir `04_migrate_users_data.sql`
5. Ejecutar (F5)

### Opción C: Usando sqlcmd

```bash
cd server/sql
sqlcmd -S soledbserver.database.windows.net -d soledb-puntoventa -U soledb_admin -P "@s0le@dm1nAI#82," -i 03_create_users_table.sql
sqlcmd -S soledbserver.database.windows.net -d soledb-puntoventa -U soledb_admin -P "@s0le@dm1nAI#82," -i 04_migrate_users_data.sql
```

## 📊 Estructura de la Nueva Tabla

### [SIATC].[Usuarios]

```sql
IdUsuario           INT IDENTITY(1,1) PRIMARY KEY
Username            NVARCHAR(50) NOT NULL UNIQUE
Password            NVARCHAR(255) NOT NULL
Nombre              NVARCHAR(100) NOT NULL
Apellidos           NVARCHAR(150) NOT NULL
Email               NVARCHAR(255) NOT NULL
Telefono            NVARCHAR(50) NULL
DNI                 VARCHAR(20) NULL
IdRol               INT NOT NULL (FK -> Roles)
IdEmpresa           NVARCHAR(50) NULL (FK -> Empresas)
CodigoTecnico       VARCHAR(50) NULL
CodigoUsuario       VARCHAR(50) NULL
Activo              BIT DEFAULT 1
PrimerLogin         BIT DEFAULT 1
FechaCreacion       DATETIME2 DEFAULT GETDATE()
FechaModificacion   DATETIME2 DEFAULT GETDATE()
FechaUltimoLogin    DATETIME2 NULL
CreadoPor           NVARCHAR(50) NULL
ModificadoPor       NVARCHAR(50) NULL
```

### [SIATC].[Roles]

| IdRol | NombreRol  | Descripción                                    |
|-------|------------|------------------------------------------------|
| 1     | ADMIN      | Administrador del sistema con acceso completo  |
| 2     | SUPERVISOR | Supervisor de operaciones                      |
| 3     | TECNICO    | Técnico de campo                               |
| 4     | OPERADOR   | Operador con acceso limitado                   |
| 5     | CHOFER     | Chofer con acceso a rutas                      |
| 6     | ASISTENTE  | Asistente administrativo                       |

## 🔄 Proceso de Migración

1. **Extracción de empresas**
   - Desde `[dbo].[GAC_APP_TB_USUARIOS].Empresa`
   - Desde `[SIATC].[Tickets].IDEmpresa`

2. **Migración de usuarios existentes**
   - Mapeo automático de tipos de usuario a roles
   - Preservación de contraseñas (temporalmente)
   - Preservación de datos de login

3. **Extracción de técnicos**
   - Desde `[SIATC].[Tickets]` (NombreTecnico, ApellidoTecnico, CodigoTecnico)
   - Generación automática de username: `TEC_[CodigoTecnico]`
   - Email generado: `[nombre].[apellido]@sole.com.pe`

4. **Actualización de códigos**
   - Asignación de `CodigoTecnico` a usuarios existentes

## ⚠️ Consideraciones Importantes

### Contraseñas

- Las contraseñas actuales se migran **sin hash** temporalmente
- **IMPORTANTE**: Implementar bcrypt antes de producción
- Contraseña por defecto para nuevos técnicos: `123`
- Bandera `PrimerLogin = 1` para forzar cambio de contraseña

### Duplicados

- Los scripts verifican existencia antes de insertar
- Se usa `Username` como clave única
- Los técnicos con mismo nombre pero diferente código se distinguen por `CodigoTecnico`

### Datos Faltantes

- Si un usuario no tiene nombre: `'Sin nombre'`
- Si no tiene email: `[username]@sole.com.pe`
- Si no tiene contraseña: `'123'`

## 📝 Próximos Pasos

### 1. Backend (server/index.js)

```javascript
// Instalar bcryptjs
npm install bcryptjs

// Actualizar queries para usar [SIATC].[Usuarios]
// Implementar hash de contraseñas en registro/login
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, user.Password);
```

### 2. Endpoints a Crear

- `POST /api/auth/change-password` - Cambio de contraseña
- `POST /api/auth/first-login` - Primer login obligatorio
- `GET /api/users` - Listar usuarios (admin)
- `POST /api/users` - Crear usuario (admin)
- `PUT /api/users/:id` - Actualizar usuario (admin)
- `DELETE /api/users/:id` - Desactivar usuario (admin)

### 3. Frontend (Angular)

- Detectar `PrimerLogin = 1` después de autenticación
- Mostrar modal obligatorio de cambio de contraseña
- Validación de contraseña fuerte
- Gestión de usuarios (módulo admin)

### 4. Seguridad

- [ ] Implementar bcrypt para todas las contraseñas
- [ ] Forzar cambio de contraseña en primer login
- [ ] Agregar validación de complejidad de contraseña
- [ ] Implementar bloqueo de cuenta tras intentos fallidos
- [ ] Agregar logs de auditoría de accesos

## 🔍 Verificación Post-Migración

```sql
-- Verificar conteos
SELECT 'Empresas' as Tabla, COUNT(*) as Total FROM [SIATC].[Empresas]
UNION ALL
SELECT 'Usuarios', COUNT(*) FROM [SIATC].[Usuarios]
UNION ALL
SELECT 'Roles', COUNT(*) FROM [SIATC].[Roles];

-- Usuarios por rol
SELECT 
    R.NombreRol,
    COUNT(U.IdUsuario) as Cantidad,
    SUM(CASE WHEN U.Activo = 1 THEN 1 ELSE 0 END) as Activos
FROM [SIATC].[Roles] R
LEFT JOIN [SIATC].[Usuarios] U ON R.IdRol = U.IdRol
GROUP BY R.NombreRol;

-- Técnicos con código
SELECT COUNT(*) as TecnicosConCodigo
FROM [SIATC].[Usuarios]
WHERE CodigoTecnico IS NOT NULL;

-- Verificar integridad
SELECT 
    'Usuarios sin rol' as Problema,
    COUNT(*) as Cantidad
FROM [SIATC].[Usuarios]
WHERE IdRol IS NULL

UNION ALL

SELECT 
    'Usuarios sin email',
    COUNT(*)
FROM [SIATC].[Usuarios]
WHERE Email IS NULL OR Email = '';
```

## 📞 Soporte

Si encuentras algún error durante la migración:

1. Revisa los logs generados por `setup_users_db.js`
2. Verifica la conectividad a la base de datos
3. Asegúrate de tener permisos suficientes
4. Consulta los mensajes de error específicos

---

**Última actualización**: 11 de febrero de 2026  
**Autor**: Sistema SIATC 3.0  
**Versión**: 1.0.0
