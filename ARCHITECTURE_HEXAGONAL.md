# Arquitectura Hexagonal - Sistema de Gestión de Tareas

## Explicación en español: Cómo los adaptadores implementan puertos y desacoplan la infraestructura

### 1. ¿Qué es un Puerto (Port)?

Un **puerto** es una interfaz que define un contrato (conjunto de métodos) que la aplicación necesita.

```typescript
// backend/src/domain/ports/ITareaRepository.ts (PUERTO)
export interface ITareaRepository {
  save(tarea: Tarea): Promise<Tarea>;
  findById(id: string): Promise<Tarea | null>;
  findAll(projectId?: string): Promise<Tarea[]>;
  update(tarea: Tarea): Promise<Tarea>;
  delete(id: string): Promise<void>;
}
```

**El dominio NO SABE** si estos métodos se implementan con:
- SQLite
- PostgreSQL
- MongoDB
- Una API REST
- Un archivo JSON
- Un mock de prueba

### 2. ¿Qué es un Adaptador (Adapter)?

Un **adaptador** es la implementación concreta de un puerto para una tecnología específica.

```typescript
// backend/src/infrastructure/adapters/TareaRepositoryImpl.ts (ADAPTADOR)
export class TareaRepositoryImpl implements ITareaRepository {
  async save(tarea: Tarea): Promise<Tarea> {
    // Aquí va la lógica específica de SQLite
    const db = await getDatabase();
    await db.run(
      `INSERT INTO tareas (id, title, ...) VALUES (?, ?, ...)`,
      // ... parámetros
    );
    return tarea;
  }
  // ... más métodos
}
```

**El adaptador SÍ SABE** exactamente cómo guardar en SQLite, pero esta lógica está **aislada** en infraestructura.

### 3. Desacoplamiento en la práctica

**Flujo sin hexagonal (acoplamiento fuerte):**
```
TareaService → SQLiteTaskRepository (hardcoded)
                    ↓
                Si cambio de BD, ¡tengo que cambiar TareaService!
```

**Flujo con hexagonal (desacoplado):**
```
TareaService → ITareaRepository (interfaz/puerto)
                    ↓
            Puede ser: TareaRepositoryImpl (SQLite)
                       PostgresRepository (PostgreSQL)
                       MongoRepository (MongoDB)
                       MockRepository (Tests)
                    ↓
            Se inyecta en el constructor
```

**Código:**

```typescript
// backend/src/application/services/TareaService.ts
export class TareaService {
  constructor(
    private readonly tareaRepo: ITareaRepository  // ← Interfaz, no implementación
  ) {}

  async createTask(command: CrearTareaCommand): Promise<Tarea> {
    const tarea = command.execute();
    return this.tareaRepo.save(tarea);  // ← Llamada a través del puerto
  }
}
```

**Inyección en server.ts:**

```typescript
// backend/src/infrastructure/server.ts

// Si uso SQLite:
const tareaRepo: ITareaRepository = new TareaRepositoryImpl();

// Si mañana quiero cambiar a PostgreSQL, solo cambio esta línea:
const tareaRepo: ITareaRepository = new PostgresRepositoryImpl();

const tareaService = new TareaService(tareaRepo);
```

**En tests, uso mocks:**

```typescript
const mockRepo: ITareaRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  // ...
};
const service = new TareaService(mockRepo);
```

### 4. Capas de la arquitectura hexagonal

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL WORLD                            │
│  (Cliente HTTP, UI, otro sistema, BD, API externa)          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│           INFRASTRUCTURE (Adaptadores)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Express     │  │   SQLite     │  │   JWT Auth   │      │
│  │ Controllers  │  │  Repository  │  │  Middleware  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ Implementa puertos
┌────────────────────────▼────────────────────────────────────┐
│           APPLICATION (Servicios, Casos de Uso)             │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ TareaService │  │ProyectoService│                        │
│  └──────────────┘  └──────────────┘                         │
└────────────────────────┬────────────────────────────────────┘
                         │ Usa puertos
┌────────────────────────▼────────────────────────────────────┐
│                 DOMAIN (Núcleo puro)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Entidades  │  │   Comandos   │  │   Puertos    │      │
│  │(Tarea, Pro)  │  │(CrearTarea,  │  │(Interfaces)  │      │
│  │              │  │ MoverTarea)  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**El dominio NO IMPORTA nada externo** (excepto tipos básicos).
**La aplicación IMPORTA dominio y puertos** (no implementaciones).
**La infraestructura IMPORTA todo** y conecta las piezas.

---

## Seguridad: Middleware de roles

### JWT + Middleware de autenticación

```typescript
// backend/src/infrastructure/middlewares/authMiddleware.ts

export function authMiddleware(req: AuthRequest, res, next) {
  const token = req.headers.authorization?.substring(7);
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;  // Adjunta usuario al request
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware de autorización por roles
 */
export function checkRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

### Uso en rutas

```typescript
// backend/src/infrastructure/routes/proyectoRoutes.ts

router.use(authMiddleware);  // Proteger toda la ruta

router.put(
  '/:id/archive',
  checkRole(UserRole.ADMIN),  // Solo ADMIN
  async (req, res) => {
    // ...
  }
);
```

**Token JWT de ejemplo:**
```json
{
  "id": "u1",
  "name": "Ana",
  "email": "ana@email.com",
  "role": "ADMIN",
  "iat": 1705326000,
  "exp": 1705412400
}
```

**Header HTTP:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Documentación Swagger

### ¿Cómo funciona swagger-jsdoc?

En cada ruta, agregamos comentarios JSDoc especiales:

```typescript
// backend/src/infrastructure/routes/tareaRoutes.ts

/**
 * @swagger
 * /api/tareas:
 *   post:
 *     summary: Crear una nueva tarea
 *     tags:
 *       - Tareas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               projectId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tarea creada
 *       400:
 *         description: Datos inválidos
 */
router.post('/', async (req, res) => {
  // Implementación...
});
```

**swagger-jsdoc genera OpenAPI 3.0 YAML** a partir de estos comentarios.

**Resultado en `/api-docs`:**
- Documentación interactiva
- "Try it out" para probar endpoints
- Esquemas de request/response
- Autenticación Bearer token integrada

---

## i18n (Internacionalización)

### Sistema simple basado en JSON

```json
// shared/i18n/es.json
{
  "tarea": {
    "creada": "Tarea creada exitosamente",
    "movida": "Tarea movida a nuevo estado"
  }
}
```

### Uso en código

```typescript
import { i18n } from './i18nManager';

const mensaje = i18n.t('es', 'tarea.creada');
// → "Tarea creada exitosamente"
```

### En respuestas HTTP

```typescript
res.json({
  success: true,
  data: tarea.toJSON(),
  message: i18n.t('es', 'tarea.creada')
});
```

### Endpoint para obtener todas las traducciones

```
GET /api/i18n/es
GET /api/i18n/en
```

---

## Transacciones con Commands

### Función `transaction()` en SQLiteDatabase

```typescript
// backend/src/infrastructure/adapters/SQLiteDatabase.ts

export async function transaction<T>(
  callback: (db: Database) => Promise<T>
): Promise<T> {
  const db = await getDatabase();
  try {
    await db.run('BEGIN TRANSACTION');
    const result = await callback(db);
    await db.run('COMMIT');
    return result;
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}
```

### Uso en adaptadores

```typescript
// backend/src/infrastructure/adapters/TareaRepositoryImpl.ts

async save(tarea: Tarea): Promise<Tarea> {
  return transaction(async (db) => {
    await db.run(
      `INSERT INTO tareas (...) VALUES (...)`,
      // ...
    );
    return tarea;
  });
}
```

**Beneficios:**
- Si algo falla, se hace ROLLBACK automático
- Todas las operaciones se ejecutan atómicamente
- El dominio no necesita saber de transacciones

---

## Cómo ejecutar

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Backend correrá en http://localhost:3000
# Swagger en http://localhost:3000/api-docs
# Frontend en http://localhost:8080
```

---

## Resumen: Por qué hexagonal es mejor

| Aspecto | Sin Hexagonal | Con Hexagonal |
|--------|---------------|---------------|
| **Cambiar BD** | Editar 10+ archivos | Crear 1 adaptador nuevo |
| **Testear lógica** | Necesito BD real | Uso mocks |
| **Código del dominio** | Acoplado a Express, SQLite | Puro, reutilizable |
| **Mantenibilidad** | Difícil, interdependencias | Fácil, capas claras |
| **Seguridad** | Mezclada con rutas | Centralizada en middlewares |
| **Documentación** | Manual | Auto-generada con Swagger |
