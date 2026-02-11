# SIAT Lite - Guía de Despliegue

## 📋 Requisitos Previos

- VPS con EasyPanel instalado
- Cuenta de GitHub
- Acceso a la base de datos SQL Server (Azure SQL)

---

## 🚀 Paso 1: Subir a GitHub

### 1.1 Crear repositorio en GitHub
1. Ve a [github.com/new](https://github.com/new)
2. Nombre: `siatc-lite` (o el que prefieras)
3. Privado (recomendado)
4. **NO** inicializar con README

### 1.2 Subir código desde tu PC

```bash
# En la carpeta del proyecto
cd "c:\Users\onunez\OneDrive - MT INDUSTRIAL S.A.C\Escritorio\Proyectos_Antigravity\siatc-3.0"

# Inicializar git (si no está)
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "Initial commit: SIAT Lite v3.0"

# Conectar con GitHub (reemplaza con tu usuario)
git remote add origin https://github.com/TU_USUARIO/siatc-lite.git

# Subir
git branch -M main
git push -u origin main
```

---

## 🐳 Paso 2: Configurar EasyPanel

### 2.1 Conectar GitHub con EasyPanel

1. En EasyPanel, ve a **Settings** → **GitHub**
2. Conecta tu cuenta de GitHub
3. Autoriza acceso al repositorio

### 2.2 Crear el Proyecto

1. Click en **Create Project**
2. Nombre: `siatc-lite`

### 2.3 Crear Servicio Backend

1. En el proyecto, click **+ Add Service** → **App**
2. Configuración:
   - **Name**: `backend`
   - **Source**: GitHub
   - **Repository**: tu-usuario/siatc-lite
   - **Branch**: main
   - **Build Path**: `/server`
   - **Port**: `3001`

3. En **Environment Variables**, agregar:
   ```
   NODE_ENV=production
   PORT=3001
   DB_USER=soledbserveradmin
   DB_PASSWORD=@s0le@dm1nAI#82,
   DB_SERVER=soledbserver.database.windows.net
   DB_NAME=soledb-puntoventa
   JWT_SECRET=tu_clave_secreta_super_segura_aqui
   CORS_ORIGIN=https://tu-dominio.com
   ```

4. Click **Deploy**

### 2.4 Crear Servicio Frontend

1. Click **+ Add Service** → **App**
2. Configuración:
   - **Name**: `frontend`
   - **Source**: GitHub
   - **Repository**: tu-usuario/siatc-lite
   - **Branch**: main
   - **Build Path**: `/` (raíz)
   - **Port**: `80`

3. En **Domains**, agregar tu dominio:
   - `siatc.tu-dominio.com` o usar el dominio generado por EasyPanel

4. Click **Deploy**

---

## 🌐 Paso 3: Configurar Dominio

### Opción A: Usar subdominio de EasyPanel
EasyPanel genera automáticamente un dominio tipo:
`frontend-siatc-xxxxx.easypanel.host`

### Opción B: Usar tu propio dominio
1. En tu proveedor DNS, crear registro:
   - **Tipo**: A
   - **Nombre**: siatc (o @)
   - **Valor**: IP de tu VPS

2. En EasyPanel → Frontend → **Domains**:
   - Agregar: `siatc.tu-dominio.com`
   - Habilitar **HTTPS** (Let's Encrypt automático)

---

## 🔧 Paso 4: Configurar Proxy Interno

Para que el frontend pueda comunicarse con el backend:

1. En EasyPanel → Frontend → **Settings**
2. Agregar variable de entorno o editar nginx.conf

**Alternativa usando Docker Compose** (recomendado):

1. En EasyPanel, crear un servicio tipo **Docker Compose**
2. Pegar el contenido de `docker-compose.yml`
3. EasyPanel creará ambos servicios conectados

---

## ✅ Verificación

1. Accede a `https://tu-dominio.com`
2. Deberías ver la pantalla de login
3. Ingresa con: `CCERNA` / `123`

---

## 🛠️ Solución de Problemas

### Error de conexión a la API
- Verificar que el backend esté corriendo (revisar logs en EasyPanel)
- Verificar variables de entorno del backend
- Verificar que la IP del VPS esté permitida en Azure SQL Firewall

### Error de base de datos
- Verificar credenciales en variables de entorno
- En Azure Portal → SQL Database → Firewall: agregar IP del VPS

### Página en blanco
- Revisar logs del frontend en EasyPanel
- Verificar que el build de Angular se completó correctamente

---

## 📂 Estructura de Archivos Docker

```
siatc-3.0/
├── Dockerfile          # Frontend (Angular + Nginx)
├── nginx.conf          # Configuración de Nginx
├── docker-compose.yml  # Orquestación
├── server/
│   ├── Dockerfile      # Backend (Node.js)
│   └── .env.example    # Template de variables
└── src/
    └── environments/
        ├── environment.ts       # Dev (localhost)
        └── environment.prod.ts  # Prod (rutas relativas)
```

---

## 🔄 Actualizaciones Futuras

1. Hacer cambios en el código
2. Commit y push a GitHub:
   ```bash
   git add .
   git commit -m "descripción del cambio"
   git push
   ```
3. En EasyPanel, click **Redeploy** en cada servicio
   - O configurar **Auto Deploy** en Settings

---

## 📞 Soporte

Si tienes problemas:
1. Revisar logs en EasyPanel (botón Logs en cada servicio)
2. Verificar que las variables de entorno están correctas
3. Revisar la consola del navegador (F12 → Console)
