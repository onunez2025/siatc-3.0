# 🚀 Configuración de Servicios QAS en EasyPanel

## 📋 Resumen

Crear 2 servicios QAS usando el branch `qas/user-migration` que compartirán la misma base de datos con producción.

---

## 1️⃣ Backend QAS - siatc3backend-qas

### Configuración en EasyPanel:

```yaml
Service Name: siatc3backend-qas
Type: App
```

### Source:
```yaml
Repository: https://github.com/onunez2025/siatc-3.0.git
Branch: qas/user-migration
Build Method: Dockerfile
Dockerfile Path: /server/Dockerfile
```

### Networking:
```yaml
Container Port: 3001
Public: Yes (para acceso directo si es necesario)
Domain: gac-sole-siatc3backend-qas.ekmz7d.easypanel.host
```

### Environment Variables:
```env
DB_SERVER=soledbserver.database.windows.net
DB_NAME=soledb-puntoventa
DB_USER=soledbserveradmin
DB_PASSWORD=@s0le@dm1nAI#82,
PORT=3001
NODE_ENV=development
```

### Recursos Sugeridos:
```yaml
CPU: 0.5 cores
Memory: 512 MB
```

---

## 2️⃣ Frontend QAS - siatc3frontend-qas

### Configuración en EasyPanel:

```yaml
Service Name: siatc3frontend-qas
Type: App
```

### Source:
```yaml
Repository: https://github.com/onunez2025/siatc-3.0.git
Branch: qas/user-migration
Build Method: Dockerfile
Dockerfile Path: /Dockerfile
Build Arguments:
  NGINX_CONFIG: nginx-qas.conf
```

### Networking:
```yaml
Container Port: 80
Public: Yes
Domain: gac-sole-siatc3frontend-qas.ekmz7d.easypanel.host
```

### Recursos Sugeridos:
```yaml
CPU: 0.3 cores
Memory: 256 MB
```

---

## 🔧 Ajustes Necesarios en el Código

### Archivo a modificar: `nginx.conf`

Necesitamos actualizar la línea que apunta al backend para que use el nombre correcto del servicio QAS.

**Cambio necesario:**
```nginx
# Línea actual:
proxy_pass http://siatc3backned:3001/api/;

# Cambiar a:
proxy_pass http://siatc3backend-qas:3001/api/;
```

---

## 📝 Pasos Detallados en EasyPanel

### Paso 1: Crear Backend QAS

1. En EasyPanel, ir a **Services** → **+ Create Service**
2. Nombre: `siatc3backend-qas`
3. Type: **App**
4. En **Source**:
   - Git Provider: GitHub
   - Repository: `onunez2025/siatc-3.0`
   - Branch: `qas/user-migration` ⚠️ **IMPORTANTE**
   - Build Method: Dockerfile
   - Dockerfile Path: `/server/Dockerfile`
5. En **Networking**:
   - Container Port: `3001`
   - ✅ Enable Public Access
   - Domain will be auto-generated
6. En **Environment**:
   - Agregar las variables listadas arriba
7. **Deploy**

### Paso 2: Crear Frontend QAS

1. En EasyPanel, ir a **Services** → **+ Create Service**
2. Nombre: `siatc3frontend-qas`
3. Type: **App**
4. En **Source**:
   - Git Provider: GitHub
   - Repository: `onunez2025/siatc-3.0`
   - Branch: `qas/user-migration` ⚠️ **IMPORTANTE**
   - Build Method: Dockerfile
   - Dockerfile Path: `/Dockerfile` (raíz)
5. En **Networking**:
   - Container Port: `80`
   - ✅ Enable Public Access
   - Domain will be auto-generated
6. En **Build** (⚠️ **MUY IMPORTANTE**):
   - Build Arguments:
     - Key: `NGINX_CONFIG`
     - Value: `nginx-qas.conf`
   - Esto le indica al Dockerfile que use el nginx.conf específico para QAS
7. **Deploy**

---

## ✅ Configuración Automática de nginx.conf

El Dockerfile ahora soporta diferentes configuraciones de nginx mediante build arguments:

- **Producción** (default): Usa `nginx.conf` → Apunta a `siatc3backned:3001`
- **QAS**: Usa `nginx-qas.conf` → Apunta a `siatc3backend-qas:3001`

No necesitas modificar archivos manualmente. El build argument `NGINX_CONFIG=nginx-qas.conf` se encarga de todo.

---

## 🔄 Auto-Deploy

Una vez configurado:

```
git push origin qas/user-migration
    ↓
EasyPanel detecta cambios automáticamente
    ↓
Redeploy de ambos servicios QAS
    ↓
Cambios visibles en ~2-3 minutos
```

---

## 🌐 URLs Finales

Después de crear los servicios:

**QAS:**
- Frontend: `https://gac-sole-siatc3frontend-qas.ekmz7d.easypanel.host`
- Backend: `https://gac-sole-siatc3backend-qas.ekmz7d.easypanel.host`

**Producción (sin cambios):**
- Frontend: `https://gac-sole-siatc3frontend.ekmz7d.easypanel.host`
- Backend: `https://gac-sole-siatc3backned.ekmz7d.easypanel.host`

---

## ✅ Checklist de Verificación

Después de crear los servicios QAS:

- [ ] Backend QAS responde en `/api/health`
- [ ] Frontend QAS carga correctamente
- [ ] Login funciona en QAS
- [ ] Dashboard muestra los 1,195 tickets
- [ ] Stats endpoint funciona
- [ ] No hay errores de CORS
- [ ] Backend QAS se conecta a la DB correctamente

---

## 🐛 Troubleshooting

### Backend no conecta a DB
- Verificar variables de entorno
- Revisar IP firewall de Azure SQL (72.61.75.5)
- Ver logs en EasyPanel

### Frontend no ve backend
- Verificar nombre del servicio en nginx.conf
- Debe ser `siatc3backend-qas:3001`
- Forzar reconstrucción con cache bust

### 502 Bad Gateway
- Backend aún está iniciando (esperar 1-2 min)
- Ver logs del backend para errores

---

## 💡 Tips

1. **Logs en tiempo real**: En EasyPanel, ve a cada servicio → Logs tab
2. **Rebuild manual**: Si algo no funciona → "Force Rebuild"
3. **Misma DB**: Ambos ambientes usan la misma base de datos
4. **Probar primero**: Siempre probar en QAS antes de mergear a main
5. **Build Arguments**: Asegúrate de configurar `NGINX_CONFIG=nginx-qas.conf` en el frontend QAS

---

## 📸 Screenshot de Configuración Build Arguments en EasyPanel

Cuando crees el servicio frontend QAS, en la sección **Build**:

```
Build Arguments:
┌────────────────┬──────────────────┐
│ Key            │ Value            │
├────────────────┼──────────────────┤
│ NGINX_CONFIG   │ nginx-qas.conf   │
└────────────────┴──────────────────┘
```

Sin esto, el frontend QAS intentará conectarse al backend de producción (`siatc3backned`) en lugar del backend QAS (`siatc3backend-qas`).

---

**¿Listo para crear los servicios?** 
Primero ajustaré el código para que funcione correctamente con el nombre del servicio QAS.
