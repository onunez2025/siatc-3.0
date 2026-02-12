# Estructura de Tabla Empresas Actualizada

## 📋 Cambio Implementado

Se separó el código FSM del nombre real de la empresa para mayor claridad y funcionalidad.

### Antes:
```sql
CREATE TABLE [SIATC].[Empresas] (
    IdEmpresa INT PRIMARY KEY,
    NombreEmpresa NVARCHAR(100) UNIQUE, -- '1301', '1302EXT', 'SOLE'
    TipoEmpresa VARCHAR(10)
);
```

### Ahora:
```sql
CREATE TABLE [SIATC].[Empresas] (
    IdEmpresa INT PRIMARY KEY,
    CodigoFSM NVARCHAR(50) UNIQUE, -- '1301', '1302EXT', 'SOLE' (para matching)
    NombreEmpresa NVARCHAR(100), -- 'Ripley', 'Saga Falabella', 'SOLE - Grupo Industrial' (para UI)
    TipoEmpresa VARCHAR(10)
);
```

---

## 🎯 Usos de Cada Campo

### CodigoFSM
- **Propósito**: Matching con `Tickets.IDEmpresa`
- **Inmutable**: NO cambiar este valor
- **Ejemplos**: '1301', '1302EXT', '1303EXT', 'SOLE'
- **Usado en**: Queries de filtrado de permisos

### NombreEmpresa
- **Propósito**: Mostrar en UI y reportes
- **Editable**: Puedes actualizarlo cuando sepas el nombre real
- **Ejemplos**: 'Ripley', 'Saga Falabella', 'Oechsle', 'SOLE - Grupo Industrial'
- **Usado en**: Frontend, perfiles de usuario, dashboards

---

## 📝 Cómo Actualizar Nombres Reales

### Opción 1: SQL Directo
```sql
UPDATE [SIATC].[Empresas]
SET NombreEmpresa = 'Ripley'
WHERE CodigoFSM = '1301';

UPDATE [SIATC].[Empresas]
SET NombreEmpresa = 'Saga Falabella'
WHERE CodigoFSM = '1302EXT';
```

### Opción 2: Script Preparado
Editar y ejecutar `server/sql/11_update_empresa_names.sql`

---

## 🔍 Ver Empresas Actuales

```sql
SELECT 
    IdEmpresa,
    CodigoFSM,
    NombreEmpresa,
    TipoEmpresa
FROM [SIATC].[Empresas]
ORDER BY TipoEmpresa, CodigoFSM;
```

---

## 🔐 Impacto en Permisos

### Query de Permisos (NO cambió logic):
```sql
-- Match con tickets usando CodigoFSM
WHERE T.IDEmpresa = E.CodigoFSM
```

### Token JWT (agrega CodigoFSM):
```javascript
{
  userId: 123,
  username: 'usuario1',
  empresa: {
    id: 2,
    codigoFSM: '1301', // Para backend logic
    nombre: 'Ripley', // Para UI
    tipo: 'CAS'
  },
  rol: { ... }
}
```

---

## ✅ Archivos Actualizados

1. **server/sql/10_update_empresas_add_codigo_fsm.sql** - Script de migración
2. **server/sql/11_update_empresa_names.sql** - Template para actualizar nombres
3. **server/auth_new.js** - Usa CodigoFSM para matching
4. **PERMISSIONS_SYSTEM.md** - Documentación actualizada
5. **server/update_empresas_schema.js** - Ejecutor del script
6. **server/verify_empresas_structure.js** - Verificar cambios

---

## ⚠️ Importante

- ✅ **CodigoFSM**: Usado en toda la lógica de permisos y matching
- ✅ **NombreEmpresa**: Solo para visualización
- ⚠️ **NO** cambiar CodigoFSM después de creado
- ✅ **SÍ** puedes actualizar NombreEmpresa cuando quieras

---

**Actualizado**: 11 de febrero de 2026  
**Por**: Sistema SIATC 3.0
