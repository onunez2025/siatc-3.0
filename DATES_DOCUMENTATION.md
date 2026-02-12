# 📅 Gestión de Fechas en SIATC 3.0

## 🎯 Filosofía del Sistema

El sistema SIATC 3.0 maneja dos conceptos de fecha que sirven propósitos diferentes:

### 1️⃣ FechaModificacionIT - Para Sincronización
**Propósito**: Detectar cambios y mantener datos actualizados  
**Usado en**: Servicio de sincronización automática (cron cada minuto)

### 2️⃣ FechaVisita - Para Gestión Operativa
**Propósito**: Organizar y gestionar el trabajo diario  
**Usado en**: Dashboard, reportes, consultas de usuarios

---

## 🔄 Sincronización Automática

### Servicio: `server/services/sync-service.js`

**Frecuencia**: Cada 1 minuto (cron)

**Query Base**:
```sql
SELECT TOP (1000) *
FROM [APPGAC].[Servicios]
WHERE TRY_CAST(FechaModificacionIT AS DATETIME) > @lastSync
ORDER BY TRY_CAST(FechaModificacionIT AS DATETIME) ASC
```

**Criterio**: 
- Trae tickets que hayan sido **modificados** desde la última sincronización
- Usa watermark (marca de agua) incremental
- No importa para qué día es la visita, solo si hubo cambios

**Ejemplo**:
```
Hoy 11 feb, 10:30 AM
- Sync trae tickets modificados desde las 10:29 AM
- Puede traer tickets con visita para hoy, mañana, o hace 3 días
- Lo importante: fueron modificados recientemente
```

---

## 🎯 Plataforma de Gestión

### Endpoints: `server/index.js`

**Query Base**:
```sql
WHERE CAST(FechaVisita AS DATE) = CAST(GETDATE() AS DATE)
```

**Criterio**:
- Muestra tickets cuya **visita está programada** para la fecha consultada
- No importa cuándo se creó o modificó el ticket
- Gestión operativa por día de trabajo

**Ejemplo**:
```
Dashboard para 11 feb:
- Muestra tickets con FechaVisita = 11 feb
- Incluye tickets creados hace 1 semana para hoy
- Incluye tickets creados hoy para hoy
- NO incluye tickets de ayer que fueron modificados hoy
```

---

## 📊 Caso de Uso Real

### Scenario del 11 de febrero de 2026:

**Ticket A**:
- `FechaVisita`: 11 feb 2026
- `FechaModificacionIT`: 10 feb 2026 5:00 PM
- **Sync del 11 feb**: ❌ No lo trae (no hay cambios hoy)
- **Dashboard del 11 feb**: ✅ Lo muestra (visita es hoy)

**Ticket B**:
- `FechaVisita`: 10 feb 2026
- `FechaModificacionIT`: 11 feb 2026 9:00 AM
- **Sync del 11 feb**: ✅ Lo trae (fue modificado hoy)
- **Dashboard del 11 feb**: ❌ No lo muestra (visita fue ayer)

**Ticket C**:
- `FechaVisita`: 11 feb 2026
- `FechaModificacionIT`: 11 feb 2026 8:00 AM
- **Sync del 11 feb**: ✅ Lo trae (fue modificado hoy)
- **Dashboard del 11 feb**: ✅ Lo muestra (visita es hoy)

---

## 🔢 Números del 11 de Febrero 2026

### Tabla Origen: [APPGAC].[Servicios]
```
Tickets con FechaVisita = 11 feb:     1,195
Tickets modificados el 11 feb:        1,055
```

### ¿Por qué la diferencia?

**140 tickets** tienen:
- ✅ `FechaVisita = 11 feb` (aparecen en dashboard)
- ❌ `FechaModificacionIT < 11 feb` (no procesados por sync de hoy)

**Estos 140 tickets** fueron:
- Creados/modificados días anteriores
- Programados para visita del 11 feb
- Ya están en [SIATC].[Tickets] desde antes

---

## 🛠️ Endpoints Principales

### Dashboard - Stats Endpoint
```javascript
// GET /api/tickets/stats
WHERE CAST(FechaVisita AS DATE) = @today
```
✅ Usa `FechaVisita` - Muestra carga operativa del día

### Lista de Tickets
```javascript
// GET /api/tickets
WHERE CAST(FechaVisita AS DATE) = CAST(GETDATE() AS DATE)
```
✅ Usa `FechaVisita` - Tickets a trabajar hoy

### Sincronización Manual
```javascript
// server/resync_today_tickets.js
WHERE CAST(FechaVisita AS DATE) = CAST(GETDATE() AS DATE)
   OR CAST(FechaUltimaModificacion AS DATE) = CAST(GETDATE() AS DATE)
```
✅ Usa **ambas** - Captura todo lo relevante para el día

---

## 📋 Distribución por Estado (11 Feb 2026)

### Tabla Origen y Destino (sincronizadas)
```
Estado             │ Cantidad
───────────────────┼─────────
Ready to plan      │   1,009
Cancelled          │      46
───────────────────┼─────────
TOTAL              │   1,055  ← Modificados HOY
```

### Dashboard
```
Tickets para hoy:  1,195  ← Con visita HOY
```

---

## ⚠️ Consideraciones Importantes

### ✅ Hacer:
- Usar `FechaVisita` para filtros en UI
- Usar `FechaVisita` para reportes operativos
- Usar `FechaVisita` para asignación de técnicos
- Usar `FechaModificacionIT` para sincronización

### ❌ No Hacer:
- Mostrar estadísticas basadas en `FechaModificacionIT` en dashboard
- Usar `FechaVisita` como criterio de sincronización principal
- Mezclar ambos conceptos en el mismo query sin documentar claramente

---

## 🧪 Scripts de Verificación

### Comparar Sincronización vs Gestión
```bash
cd server
node compare_tickets_by_state.js
```
Muestra:
- Tickets en origen vs destino por estado
- Diferencias detectadas
- Tickets de días anteriores aún en sistema

### Resincronización Manual
```bash
cd server
node resync_today_tickets.js
```
Fuerza actualización de todos los tickets del día usando **ambas** fechas.

---

## 📚 Referencias

### Archivos Clave:
- `server/services/sync-service.js` - Sincronización automática cada minuto
- `server/index.js` - Endpoints de API (líneas 274, 301, 396, 406)
- `server/resync_today_tickets.js` - Script de resincronización manual
- `server/compare_tickets_by_state.js` - Script de comparación

### Queries Importantes:
```sql
-- Para Dashboard (Gestión Operativa)
SELECT * FROM [SIATC].[Tickets]
WHERE CAST(FechaVisita AS DATE) = CAST(GETDATE() AS DATE)

-- Para Sincronización (Cambios Incrementales)
SELECT * FROM [APPGAC].[Servicios]
WHERE TRY_CAST(FechaModificacionIT AS DATETIME) > @lastSync

-- Para Resync Manual (Completo del día)
SELECT * FROM [APPGAC].[Servicios]
WHERE CAST(FechaVisita AS DATE) = CAST(GETDATE() AS DATE)
   OR CAST(FechaUltimaModificacion AS DATE) = CAST(GETDATE() AS DATE)
```

---

**Última actualización**: 11 de febrero de 2026  
**Autor**: Sistema SIATC 3.0  
**Versión**: 1.0.0
