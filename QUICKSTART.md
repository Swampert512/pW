# Quick Start - Sistema de Gestión de Tareas

## 1. Instalación

```bash
# Clonar o descargar el proyecto
cd gestor-de-tareas

# Instalar todas las dependencias
npm install
```

## 2. Ejecutar la aplicación

```bash
# Modo desarrollo (backend + frontend simultáneamente)
npm run dev
```

**Salida esperada:**
```
✅ Servidor ejecutándose en http://localhost:3000
📚 Documentación Swagger en http://localhost:3000/api-docs
🏥 Health check en http://localhost:3000/health
🌐 Traducción en http://localhost:3000/api/i18n/es
```

## 3. Acceder a los servicios

| Servicio | URL | Descripción |
|----------|-----|-------------|
| API REST | `http://localhost:3000/api` | Endpoints principales |
| Swagger UI | `http://localhost:3000/api-docs` | Documentación interactiva |
| Health Check | `http://localhost:3000/health` | Estado del servidor |
| Frontend | `http://localhost:8080` | Interfaz web (live-server) |
| i18n ES | `http://localhost:3000/api/i18n/es` | Traducciones español |
| i18n EN | `http://localhost:3000/api/i18n/en` | Traducciones inglés |

## 4. Ejecutar pruebas

```bash
# Correr todos los tests (unit + integration)
npm test

# Correr tests de un archivo específico
npm test -- Tarea.test.ts

# Correr tests con coverage
npm test -- --coverage
```

## 5. Compilar TypeScript

```bash
# Compilar a JavaScript (output en ./dist)
npm run build

# Ejecutar desde compilación
npm start
```

## 6. Usar la API (ejemplos con curl)

### a) Obtener traducciones

```bash
curl http://localhost:3000/api/i18n/es | jq
```

### b) Health check

```bash
curl http://localhost:3000/health | jq
```

### c) Crear proyecto (requiere autenticación)

```bash
# Primero, generar un token JWT (en pruebas, usa uno dummy)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InUxIiwibmFtZSI6IkFuYSIsImVtYWlsIjoiYW5hQGVtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiJ9.XXXXX"

curl -X POST http://localhost:3000/api/proyectos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Proyecto",
    "description": "Descripción del proyecto"
  }' | jq
```

### d) Listar proyectos

```bash
curl -X GET http://localhost:3000/api/proyectos \
  -H "Authorization: Bearer $TOKEN" | jq
```

### e) Crear tarea

```bash
curl -X POST http://localhost:3000/api/tareas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implementar login",
    "description": "Agregar autenticación JWT",
    "projectId": "proj-123",
    "dueDate": "2025-12-31T23:59:59Z",
    "priority": "ALTA"
  }' | jq
```

### f) Mover tarea a nuevo estado

```bash
curl -X PUT http://localhost:3000/api/tareas/tarea-123/move \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "state": "IN_PROGRESS"
  }' | jq
```

### g) Asignar responsable

```bash
curl -X PUT http://localhost:3000/api/tareas/tarea-123/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "responsibleId": "u1",
    "responsibleName": "Ana García",
    "responsibleEmail": "ana@email.com",
    "responsibleRole": "MIEMBRO"
  }' | jq
```

### h) Obtener dashboard stats

```bash
curl -X GET "http://localhost:3000/api/tareas/proyecto/proj-123/dashboard" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 7. Generar un token JWT para pruebas

**En Node.js REPL:**

```javascript
const jwt = require('jsonwebtoken');

const payload = {
  id: 'u1',
  name: 'Ana García',
  email: 'ana@email.com',
  role: 'ADMIN'
};

const token = jwt.sign(payload, 'dev-secret-key', { expiresIn: '24h' });
console.log(token);
```

O usa esta herramienta en línea: https://jwt.io

## 8. Estructura de carpetas principales

```
gestor-de-tareas/
├── backend/src/
│   ├── domain/              # Núcleo puro (entidades, puertos, comandos)
│   ├── application/         # Servicios y casos de uso
│   └── infrastructure/      # Adaptadores, rutas, middlewares
├── frontend/src/            # HTML, CSS, Controllers vanilla
├── shared/                  # Tipos, enums, i18n compartidos
├── tests/                   # Unit tests + integration tests
├── docs/                    # Swagger YAML
└── package.json, tsconfig.json, jest.config.js
```

## 9. Variables de entorno

Crea un archivo `.env` (opcional):

```bash
PORT=3000
JWT_SECRET=my-super-secret-key
NODE_ENV=development
```

## 10. Troubleshooting

### Error: "Port 3000 is already in use"

```bash
# Encuentra el proceso que usa puerto 3000
lsof -i :3000
# O cambia el puerto:
PORT=3001 npm run dev
```

### Error: "Cannot find module 'sqlite'"

```bash
# Reinstala dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: "TypeScript compilation failed"

```bash
# Limpia cache de TypeScript
rm -rf dist/
npm run build
```

### Los tests no corren

```bash
# Asegúrate de tener jest.config.js correcto
npm test -- --config jest.config.js
```

## 11. Próximos pasos

1. **Autenticación real**: Implementar login endpoint que genere JWTs
2. **Base de datos persistente**: Cambiar de SQLite a PostgreSQL (crear nuevo adaptador)
3. **Frontend mejorado**: Integrar con la API desde el controllers.ts
4. **Notificaciones**: Agregar WebSockets para updates en tiempo real
5. **Reportes**: Generar PDFs con estadísticas de proyectos

## 12. Documentación completa

Ver `ARCHITECTURE_HEXAGONAL.md` para detalles sobre:
- Arquitectura hexagonal y desacoplamiento
- Patrón Command y transacciones
- Seguridad con JWT y roles
- Sistema de i18n
- Swagger y auto-documentación
