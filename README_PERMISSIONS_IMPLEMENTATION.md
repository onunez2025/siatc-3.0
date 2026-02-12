# Sistema de Permisos - Guía de Implementación

## 📋 Resumen

Nueva arquitectura de usuarios con:
- **3 tablas relacionadas**: Usuarios, Empresas, Roles
- **7 roles**: Administrador, Técnico, Supervisor Técnico, Asesor, Supervisor Asesor, Asistente Admin, Invitado
- **Permisos basados en empresa**: PROPIA (ve todo) vs CAS (solo su empresa)
- **Filtro especial**: Técnicos siempre ven solo sus tickets asignados

---

## 🗂️ Archivos Creados

### Scripts SQL (en orden de ejecución):
1. **05_rebuild_empresas_table.sql** - Crea tabla Empresas con TipoEmpresa
2. **06_rebuild_roles_table.sql** - Crea tabla Roles con 7 roles
3. **08_populate_empresas_from_tickets.sql** - Puebla empresas desde tickets
4. **07_rebuild_usuarios_table.sql** - Crea tabla Usuarios con IdEmpresa
5. **09_create_sample_users.sql** - Crea usuarios de ejemplo

### Scripts Node.js:
- **rebuild_users_system.js** - Ejecutor principal que corre todos los SQL
- **auth_new.js** - Nueva implementación de login con permisos

### Documentación:
- **PERMISSIONS_SYSTEM.md** - Documentación completa del sistema
- **README_PERMISSIONS_IMPLEMENTATION.md** - Este archivo

---

## 🚀 Pasos de Implementación

### Paso 1: Backup (CRÍTICO)

```sql
-- Hacer backup de tablas actuales antes de eliminarlas
SELECT * INTO [SIATC].[Usuarios_BACKUP_20260211] 
FROM [SIATC].[Usuarios];

SELECT * INTO [SIATC].[Roles_BACKUP_20260211] 
FROM [SIATC].[Roles];

SELECT * INTO [SIATC].[Empresas_BACKUP_20260211] 
FROM [SIATC].[Empresas];
```

### Paso 2: Ejecutar Rebuild

```bash
cd server
node rebuild_users_system.js
```

**Resultado esperado:**
```
✓ Tabla Empresas creada con TipoEmpresa
✓ Tabla Roles creada con 7 roles
✓ Empresas pobladas (1 PROPIA + ~41 CAS)
✓ Tabla Usuarios creada (vacía)
✓ Usuario 'admin' creado con password '123'
```

### Paso 3: Crear Usuarios de Ejemplo

Ejecutar manualmente desde Azure Data Studio o SQL Server Management Studio:

```bash
# Abrir archivo en SQL tool
server/sql/09_create_sample_users.sql
```

**Usuarios creados:**
- `admin` - Administrador de SOLE
- `supervisor_tec` - Supervisor Técnico de SOLE
- `asesor_sole` - Asesor de SOLE
- `CCERNA`, `IZARATE`, `JCRUZ`, `MVERA` - Técnicos con CodigoTecnico
- `cas_*` - Un usuario de ejemplo de empresa CAS

Todos con password: `123`

### Paso 4: Instalar bcrypt (RECOMENDADO)

```bash
cd server
npm install bcryptjs
```

### Paso 5: Actualizar auth_new.js para bcrypt

En `server/auth_new.js`, desmarcar líneas de bcrypt:

```javascript
// Login - línea ~88
const passwordMatch = await bcrypt.compare(password, user.Password);

// Change Password - línea ~245
const hashedPassword = await bcrypt.hash(newPassword, 10);
```

### Paso 6: Hash de Passwords Existentes

Crear script para hashear passwords de usuarios existentes:

```javascript
// server/hash_passwords.js
const bcrypt = require('bcryptjs');
const { getConnection, sql } = require('./db');

async function hashAllPasswords() {
    const pool = await getConnection();
    const users = await pool.request().query('SELECT IdUsuario, Password FROM [SIATC].[Usuarios]');
    
    for (const user of users.recordset) {
        const hashedPassword = await bcrypt.hash(user.Password, 10);
        await pool.request()
            .input('userId', sql.Int, user.IdUsuario)
            .input('hashedPassword', sql.NVarChar, hashedPassword)
            .query('UPDATE [SIATC].[Usuarios] SET Password = @hashedPassword WHERE IdUsuario = @userId');
        console.log(`✓ Password hasheado para IdUsuario: ${user.IdUsuario}`);
    }
    
    console.log('✓ Todos los passwords hasheados');
}

hashAllPasswords();
```

### Paso 7: Integrar auth_new.js en index.js

```javascript
// server/index.js
const auth = require('./auth_new');

// Reemplazar endpoint de login actual
app.post('/api/auth/login', async (req, res) => {
    const pool = await getConnection();
    await auth.login(req, res, pool);
});

// Agregar nuevos endpoints protegidos
app.get('/api/auth/tickets', auth.authenticateToken, async (req, res) => {
    const pool = await getConnection();
    await auth.getTicketsWithPermissions(req, res, pool);
});

app.post('/api/auth/change-password', auth.authenticateToken, async (req, res) => {
    const pool = await getConnection();
    await auth.changePassword(req, res, pool);
});

app.get('/api/auth/profile', auth.authenticateToken, async (req, res) => {
    const pool = await getConnection();
    await auth.getProfile(req, res, pool);
});
```

### Paso 8: Actualizar Frontend

Modificar `src/app/core/services/auth.service.ts`:

```typescript
login(username: string, password: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/auth/login`, { username, password })
    .pipe(
      map((response: any) => {
        // Guardar token y user en localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Verificar si requiere cambio de password
        if (response.user.requiereCambioPassword) {
          this.router.navigate(['/change-password']);
        }
        
        return response;
      })
    );
}
```

---

## 🧪 Testing

### Test 1: Administrador de SOLE (ve todo)
```bash
# Login
POST /api/auth/login
{ "username": "admin", "password": "123" }

# Obtener tickets
GET /api/auth/tickets
Authorization: Bearer <token>

# Resultado esperado: 1,195 tickets (todos)
```

### Test 2: Técnico (solo sus tickets)
```bash
# Login
POST /api/auth/login
{ "username": "CCERNA", "password": "123" }

# Obtener tickets
GET /api/auth/tickets
Authorization: Bearer <token>

# Resultado esperado: Solo tickets WHERE CodigoTecnico = 'CCERNA'
```

### Test 3: Usuario CAS (solo su empresa)
```bash
# Login
POST /api/auth/login
{ "username": "cas_empresa_x", "password": "123" }

# Obtener tickets
GET /api/auth/tickets
Authorization: Bearer <token>

# Resultado esperado: Solo tickets WHERE IDEmpresa = 'EMPRESA_X'
```

### Test 4: Cambiar Password
```bash
POST /api/auth/change-password
Authorization: Bearer <token>
{
  "oldPassword": "123",
  "newPassword": "nuevaPassword123"
}

# Resultado esperado: RequiereCambioPassword = 0
```

---

## 📊 Verificación de Datos

### Ver empresas creadas:
```sql
SELECT TipoEmpresa, COUNT(*) AS Total
FROM [SIATC].[Empresas]
GROUP BY TipoEmpresa;

-- Resultado esperado:
-- PROPIA: 1 (SOLE)
-- CAS: ~41 (empresas clientes)
```

### Ver usuarios creados:
```sql
SELECT 
    U.Username,
    R.NombreRol,
    E.NombreEmpresa,
    E.TipoEmpresa,
    U.CodigoTecnico
FROM [SIATC].[Usuarios] U
INNER JOIN [SIATC].[Empresas] E ON U.IdEmpresa = E.IdEmpresa
INNER JOIN [SIATC].[Roles] R ON U.IdRol = R.IdRol
ORDER BY R.NombreRol, U.Username;
```

### Verificar permisos de técnico:
```sql
-- Tickets de CCERNA
DECLARE @userId INT = (SELECT IdUsuario FROM [SIATC].[Usuarios] WHERE Username = 'CCERNA');

SELECT T.*
FROM [SIATC].[Tickets] T
INNER JOIN [SIATC].[Usuarios] U ON U.IdUsuario = @userId
INNER JOIN [SIATC].[Empresas] E ON U.IdEmpresa = E.IdEmpresa
INNER JOIN [SIATC].[Roles] R ON U.IdRol = R.IdRol
WHERE (R.NombreRol = 'TECNICO' AND T.CodigoTecnico = U.CodigoTecnico);
```

---

## ⚠️ Consideraciones Importantes

### Seguridad:
- ✅ Implementar bcrypt ANTES de producción
- ✅ Usar HTTPS en producción
- ✅ JWT_SECRET debe ser variable de entorno segura
- ✅ Forzar cambio de password en primer login

### Base de Datos:
- ⚠️ Las tablas viejas se eliminan - hacer backup
- ⚠️ Los 779 usuarios antiguos se perderán - documentar antes
- ✅ Las empresas se crean automáticamente desde tickets existentes
- ✅ SOLE se marca como PROPIA, el resto como CAS

### Frontend:
- 🔄 Actualizar auth.service.ts para usar `/api/auth/login`
- 🔄 Manejar `requiereCambioPassword` en primera sesión
- 🔄 Mostrar permisos del usuario en UI
- 🔄 Deshabilitar funciones según rol (ej: Invitado = readonly)

### Testing:
- ✅ Probar en QAS primero
- ✅ Verificar filtrado de tickets por rol
- ✅ Confirmar que técnicos solo ven sus tickets
- ✅ Validar que empresas CAS solo ven su data

---

## 🔄 Rollback (Si algo sale mal)

```sql
-- Restaurar tablas desde backup
DROP TABLE [SIATC].[Usuarios];
DROP TABLE [SIATC].[Roles];
DROP TABLE [SIATC].[Empresas];

SELECT * INTO [SIATC].[Usuarios] FROM [SIATC].[Usuarios_BACKUP_20260211];
SELECT * INTO [SIATC].[Roles] FROM [SIATC].[Roles_BACKUP_20260211];
SELECT * INTO [SIATC].[Empresas] FROM [SIATC].[Empresas_BACKUP_20260211];

-- Recrear constraints e índices según backup original
```

---

## 📝 Notas de Desarrollo

### Por qué esta arquitectura:

1. **Separación de empresa y tipo**: Usuario tiene `IdEmpresa`, Empresa tiene `TipoEmpresa`
   - Más flexible para cambios futuros
   - Permite query eficiente con JOIN
   - Empresa CAS puede cambiar a PROPIA sin afectar usuarios

2. **Prioridad de técnico**: `WHERE rol = 'TECNICO'` se verifica primero
   - Técnico de SOLE también está limitado a sus tickets
   - Lógica consistente independiente de empresa

3. **7 roles específicos**: Más granular que los 3 anteriores
   - Permite permisos más específicos en el futuro
   - Facilita reporting por rol
   - Mejor segmentación de usuarios

---

## 🎯 Siguiente Fase

Después de implementar este sistema:

1. **Gestión de usuarios**: CRUD completo en frontend
2. **Permisos granulares**: Por módulo/funcionalidad
3. **Audit log**: Registrar acciones de usuarios
4. **Roles personalizados**: Permitir crear roles custom
5. **Multi-empresa**: Usuario puede pertenecer a varias empresas

---

## 📞 Soporte

Si encuentras issues:
1. Revisar logs de console en Node.js
2. Verificar estructura de tablas con queries de verificación
3. Confirmar que empresas y roles existen antes de crear usuarios
4. Validar que token JWT incluye información de empresa y rol

---

**Creado**: 11 de febrero de 2026  
**Autor**: Sistema SIATC 3.0  
**Versión**: 1.0.0
