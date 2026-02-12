# Sistema de Permisos - SIATC 3.0

## Fecha: 2026-02-11

## Estructura de Base de Datos

### Tabla: [SIATC].[Empresas]
```sql
CREATE TABLE [SIATC].[Empresas] (
    IdEmpresa INT IDENTITY(1,1) PRIMARY KEY,
    CodigoFSM NVARCHAR(50) NOT NULL UNIQUE, -- Código de FSM (matching con tickets)
    NombreEmpresa NVARCHAR(100) NOT NULL, -- Nombre real de la empresa
    TipoEmpresa VARCHAR(10) NOT NULL CHECK (TipoEmpresa IN ('PROPIA', 'CAS')),
    Activo BIT NOT NULL DEFAULT 1
);
```

**Lógica:**
- `CodigoFSM`: Código del sistema FSM (ej: '1301', '1302EXT', 'SOLE') - usado para matching con `Tickets.IDEmpresa`
- `NombreEmpresa`: Nombre real de la empresa para mostrar en UI (ej: 'SOLE - Grupo Industrial', 'Ripley', 'Saga Falabella')
- `TipoEmpresa = 'PROPIA'`: Empresa propia (SOLE) → Ve TODOS los tickets
- `TipoEmpresa = 'CAS'`: Cliente externo → Solo ve tickets de su empresa

### Tabla: [SIATC].[Usuarios]
```sql
CREATE TABLE [SIATC].[Usuarios] (
    IdUsuario INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL,
    IdEmpresa INT NOT NULL, -- Relación con empresa específica
    IdRol INT NOT NULL, -- Relación con rol
    CodigoTecnico NVARCHAR(20) NULL -- Solo para técnicos
);
```

### Tabla: [SIATC].[Roles]
7 roles en el sistema:
1. **ADMINISTRADOR** - Acceso completo
2. **TECNICO** - Solo tickets asignados
3. **SUPERVISOR_TECNICO** - Gestión de equipo técnico
4. **ASESOR** - Asesor comercial/servicio
5. **SUPERVISOR_ASESOR** - Gestión de asesores
6. **ASISTENTE_ADMIN** - Soporte administrativo
7. **INVITADO** - Solo lectura

---

## Matriz de Permisos

### Reglas de Visibilidad de Tickets

```
IF rol = 'TECNICO':
    → WHERE T.CodigoTecnico = usuario.CodigoTecnico
    (Siempre limitado a sus propios tickets asignados)

ELSE IF empresa.TipoEmpresa = 'PROPIA':
    → No filter (ve todos los tickets)

ELSE IF empresa.TipoEmpresa = 'CAS':
    → WHERE T.IDEmpresa = empresa.CodigoFSM
    (Solo tickets de su empresa cliente - match por código FSM)
```

### Implementación SQL

```sql
-- Query base para obtener tickets según permisos
SELECT T.* 
FROM [SIATC].[Tickets] T
INNER JOIN [SIATC].[Usuarios] U ON U.IdUsuario = @userId
INNER JOIN [SIATC].[Empresas] E ON U.IdEmpresa = E.IdEmpresa
INNER JOIN [SIATC].[Roles] R ON U.IdRol = R.IdRol
WHERE 
    -- Caso 1: Técnico - solo sus tickets
    (R.NombreRol = 'TECNICO' AND T.CodigoTecnico = U.CodigoTecnico)
    OR
    -- Caso 2: Empresa PROPIA - ve todo
    (R.NombreRol != 'TECNICO' AND E.TipoEmpresa = 'PROPIA')
    OR
    -- Caso 3: Empresa CAS - solo su empresa (match por CodigoFSM)
    (R.NombreRol != 'TECNICO' AND E.TipoEmpresa = 'CAS' AND T.IDEmpresa = E.CodigoFSM)
```

---

## Ejemplos de Usuarios

### Ejemplo 1: Administrador de SOLE
```javascript
{
  username: 'admin',
  empresa: { nombre: 'SOLE', tipo: 'PROPIA' },
  rol: 'ADMINISTRADOR'
}
// ✓ Ve TODOS los 1,195 tickets
```

### Ejemplo 2: Técnico de SOLE
```javascript
{
  username: 'CCERNA',
  empresa: { nombre: 'SOLE', tipo: 'PROPIA' },
  rol: 'TECNICO',
  codigoTecnico: 'CCERNA'
}
// ✓ Solo ve tickets WHERE CodigoTecnico = 'CCERNA'
// ⚠ Aunque SOLE es PROPIA, el rol TECNICO tiene prioridad
```

### Ejemplo 3: Supervisor de Empresa CAS
```javascript
{
  username: 'supervisor_abc',
  empresa: { nombre: 'EMPRESA_ABC', tipo: 'CAS' },
  rol: 'SUPERVISOR_TECNICO'
}
// ✓ Solo ve tickets WHERE IDEmpresa = 'EMPRESA_ABC'
```

### Ejemplo 4: Invitado de Empresa CAS
```javascript
{
  username: 'invitado_xyz',
  empresa: { 
    codigoFSM: '1301',
    nombre: 'Ripley', 
    tipo: 'CAS' 
  },
  rol: 'INVITADO'
}
// ✓ Solo ve tickets WHERE IDEmpresa = '1301' (lectura solamente)
```

---

## Implementación en Backend

### Middleware de Permisos

```javascript
// middleware/permissions.js
async function getTicketsWithPermissions(userId) {
  const query = `
    SELECT T.* 
    FROM [SIATC].[Tickets] T
    INNER JOIN [SIATC].[Usuarios] U ON U.IdUsuario = @userId
    INNER JOIN [SIATC].[Empresas] E ON U.IdEmpresa = E.IdEmpresa
    INNER JOIN [SIATC].[Roles] R ON U.IdRol = R.IdRol
    WHERE 
      (R.NombreRol = 'TECNICO' AND T.CodigoTecnico = U.CodigoTecnico)
      OR
      (R.NombreRol != 'TECNICO' AND E.TipoEmpresa = 'PROPIA')
      OR
      (R.NombreRol != 'TECNICO' AND E.TipoEmpresa = 'CAS' AND T.IDEmpresa = E.NombreEmpresa)
    ORDER BY T.FechaVisita DESC
  `;
  
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(query);
  
  return result.recordset;
}
```

### Servicio de Autenticación Actualizado

```javascript
// src/app/core/services/auth.service.ts
async login(username, password) {
  const result = await pool.request()
    .input('username', sql.NVarChar, username)
    .input('password', sql.NVarChar, password) // TODO: bcrypt.compare()
    .query(`
      SELECT 
        U.IdUsuario,
        U.Username,
        U.Nombre,
        U.Apellido,
        U.CodigoTecnico,
        U.RequiereCambioPassword,
        E.IdEmpresa,
        E.NombreEmpresa,
        E.TipoEmpresa,
        R.IdRol,
        R.NombreRol
      FROM [SIATC].[Usuarios] U
      INNER JOIN [SIATC].[Empresas] E ON U.IdEmpresa = E.IdEmpresa
      INNER JOIN [SIATC].[Roles] R ON U.IdRol = R.IdRol
      WHERE U.Username = @username 
        AND U.Password = @password
        AND U.Activo = 1
    `);
  
  if (result.recordset.length === 0) {
    throw new Error('Credenciales inválidas');
  }
  
  const user = result.recordset[0];
  
  // Generar token JWT con permisos
  const token = jwt.sign({
    uscodigoFSM: user.CodigoFSM, // Para matching con tickets
      nombre: user.NombreEmpresa, // Nombre real para UI
    username: user.Username,
    empresa: {
      id: user.IdEmpresa,
      nombre: user.NombreEmpresa,
      tipo: user.TipoEmpresa
    },
    rol: {
      id: user.IdRol,
      nombre: user.NombreRol
    },
    codigoTecnico: user.CodigoTecnico
  }, SECRET_KEY);
  
  return { token, user };
}
```

---

## Próximos Pasos

### 1. Ejecutar Rebuild
```bash
cd server
node rebuild_users_system.js
```

### 2. Instalar bcrypt
```bash
npm install bcryptjs
```

### 3. Actualizar Auth Service
- Implementar bcrypt para passwords
- Actualizar queries con JOINs a Empresas
- Implementar middleware de permisos

### 4. Crear Usuarios Adicionales
- Técnicos con CodigoTecnico
- Supervisores de SOLE
- Usuarios de empresas CAS específicas

### 5. Testing
- Probar login con diferentes roles
- Verificar filtrado de tickets por permisos
- Validar que técnicos solo vean sus tickets
- Validar que CAS solo vea su empresa

---

## Notas Importantes

⚠️ **Password Temporal**: El script crea usuario 'admin' con password '123' sin hash. Implementar bcrypt antes de producción.

⚠️ **Prioridad de Filtros**: El rol TECNICO siempre tiene prioridad - aunque su empresa sea PROPIA, solo verá sus tickets asignados.

⚠️ **Empresas Únicas**: La tabla Empresas se puebla automáticamente desde IDEmpresa en tickets existentes.

✅ **QAS Safe**: Estos cambios se pueden probar en ambiente QAS sin afectar producción.
