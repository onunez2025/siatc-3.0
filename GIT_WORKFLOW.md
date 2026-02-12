# 🌳 Git Workflow - SIATC 3.0

## Estrategia de Branches

```
main (producción)
  └── qas/user-migration (desarrollo y pruebas)
       └── feature/* (características específicas)
```

### Branches Activos

| Branch | Propósito | Estado |
|--------|-----------|--------|
| `main` | Producción estable - Código desplegado actualmente | ✅ Estable |
| `qas/user-migration` | Migración de usuarios - Pruebas y desarrollo | 🔄 Activo |

## 📋 Flujo de Trabajo

### 1. Trabajar en QAS

```bash
# Asegurarse de estar en el branch correcto
git checkout qas/user-migration

# Obtener últimos cambios
git pull origin qas/user-migration

# Hacer cambios en el código...

# Agregar archivos modificados
git add .

# Hacer commit con mensaje descriptivo
git commit -m "feat: descripción del cambio"

# Subir cambios al branch QAS
git push origin qas/user-migration
```

### 2. Desplegar en Ambiente QAS

**En EasyPanel:**
1. Ir al servicio frontend/backend
2. Cambiar branch de `main` → `qas/user-migration`
3. Forzar reconstrucción
4. Probar funcionalidad

### 3. Probar en QAS

✅ Verificar login con nueva tabla de usuarios  
✅ Probar hash de contraseñas con bcrypt  
✅ Validar primer login obligatorio  
✅ Probar CRUD de usuarios (admin)  
✅ Verificar roles y permisos  
✅ Checks de performance  

### 4. Merge a Producción

```bash
# Una vez todo validado en QAS
git checkout main
git pull origin main

# Merge del branch QAS
git merge qas/user-migration

# Resolver conflictos si existen
# Hacer commit del merge
git commit -m "Merge: User migration from QAS to production"

# Subir a producción
git push origin main
```

### 5. Desplegar en Producción

**En EasyPanel:**
1. El servicio debería detectar cambios en `main`
2. Reconstruir automáticamente o forzar reconstrucción
3. Monitorear logs
4. Validar en producción

## 🚨 Reglas Importantes

### ❌ NO hacer en `main`:

- No hacer commits directos
- No hacer push de código sin probar
- No hacer cambios experimentales

### ✅ SÍ hacer en `qas/user-migration`:

- Todos los cambios nuevos
- Experimentos y pruebas
- Refactorización
- Nuevas features

### 🔄 Sincronización

Si necesitas traer cambios de `main` a QAS:

```bash
git checkout qas/user-migration
git merge main
git push origin qas/user-migration
```

## 📊 Estado Actual del Proyecto

### Branch: `main`
- ✅ Login funcionando con tabla antigua
- ✅ Dashboard con 1,195 tickets
- ✅ Producción estable
- 📍 URL: https://gac-sole-siatc3frontend.ekmz7d.easypanel.host

### Branch: `qas/user-migration`
- ✅ Scripts SQL de migración creados
- ✅ 779 usuarios migrados
- ⏳ Pendiente: Actualizar backend para usar nueva tabla
- ⏳ Pendiente: Implementar bcrypt
- ⏳ Pendiente: Actualizar frontend

## 🛠️ Comandos Útiles

### Ver branches locales y remotos
```bash
git branch -a
```

### Ver diferencias entre branches
```bash
git diff main qas/user-migration
```

### Ver commits no mergeados
```bash
git log main..qas/user-migration
```

### Cambiar de branch
```bash
git checkout main                    # Ir a producción
git checkout qas/user-migration      # Ir a QAS
```

### Crear nuevo feature branch
```bash
git checkout -b feature/nueva-funcionalidad qas/user-migration
```

## 📝 Convención de Commits

```
feat: Nueva característica
fix: Corrección de bug
refactor: Refactorización de código
docs: Documentación
style: Cambios de formato
test: Agregar o modificar tests
chore: Tareas de mantenimiento
```

**Ejemplo:**
```bash
git commit -m "feat: Implement bcrypt password hashing in login endpoint"
```

---

**Branch actual:** `qas/user-migration`  
**Última actualización:** 11 de febrero de 2026  
**Próximo milestone:** Implementar autenticación con nueva tabla de usuarios
