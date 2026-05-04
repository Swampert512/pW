# 📋 Sistema de Gestión de Tareas - Arquitectura Hexagonal + MVC

## Descripción
Aplicación web **profesional** para gestionar proyectos y tareas con:
- **Backend**: Node.js/Express + TypeScript con arquitectura hexagonal (Domain → Application → Infrastructure)
- **Frontend**: Vanilla TypeScript con patrón MVC (sin frameworks)
- **BD**: SQLite con transacciones ACID, completamente desacoplada mediante puertos/adaptadores
- **Tests**: ~150+ tests (backend) + tests frontend con jsdom
- **i18n**: Soporte completo para español e inglés
- **API**: Swagger auto-generado + autenticación JWT + roles ADMIN/LIDER/MIEMBRO

## 🏗️ Arquitectura Hexagonal (Domain-Driven Design)

```
┌─────────────────────────────────────────────────────────┐
│        EXTERNAL WORLD (HTTP, BD, UI)                    │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│    INFRASTRUCTURE LAYER (Adaptadores)                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Express Controllers → Routes → Middleware        │   │
│  │ SQLiteRepositoryImpl → SQLite Driver             │   │
│  │ i18nManager → JSON files (es/en)                │   │
│  │ AuthMiddleware → JWT verification               │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ implements
┌────────────────────────▼────────────────────────────────┐
│   APPLICATION LAYER (Servicios & Orquestación)          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ProyectoService: CRUD + gestión de equipo        │   │
│  │ TareaService: CRUD + cambios de estado + stats   │   │
│  │ Validaciones de negocio (no Done sin responsable)│   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ uses
┌────────────────────────▼────────────────────────────────┐
│       DOMAIN LAYER (Lógica de negocio pura)             │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Entities: Tarea, Proyecto, Usuario              │   │
│  │ Commands: CrearTarea, MoverTarea, Asignar       │   │
│  │ Ports: ITareaRepository, IProyectoRepository     │   │
│  │ Value Objects: Priority, TaskState, UserRole    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### ✅ Domain Layer (Núcleo puro)
- **Entities**: `Tarea.ts`, `Proyecto.ts`, `Usuario.ts` - Lógica de dominio
- **Commands**: `CrearTareaCommand`, `MoverTareaCommand`, `AsignarResponsableCommand` - Encapsulan operaciones
- **Ports**: `ITareaRepository`, `IProyectoRepository` - Contratos para persistencia
- **Sin dependencias externas** - No conoce Express, SQLite, JWT, etc.

### ✅ Application Layer (Orquestación)
- **Services**: `ProyectoService`, `TareaService` - Orquestan comandos + repos
- **Validaciones de negocio**: "No mover a Done sin responsable"
- **Transacciones**: BEGIN → múltiples operaciones → COMMIT/ROLLBACK
- **Conoce domain pero no infraestructura**

### ✅ Infrastructure Layer (Adaptadores concretos)
- **Adaptadores**:
  - `SQLiteRepositoryImpl` implementa `ITareaRepository` (SQLite)
  - `ProyectoRepositoryImpl` implementa `IProyectoRepository` (SQLite)
  - **Cambiar a PostgreSQL**: Solo crear nuevo adaptador PostgresRepositoryImpl
- **Express Routes**: `/api/proyectos`, `/api/tareas`, `/api/tareas/:id/move`, `/api/tareas/:id/assign`, `/api/tareas/:id/comments`, `/api/usuarios`
- **Middlewares**: `authMiddleware` (JWT), `corsMiddleware`, `checkRole` (permisos)
- **Swagger**: Auto-generado desde comentarios JSDoc
- **i18n**: Traducciones ES/EN

## 🎨 Frontend (Vanilla TypeScript + MVC)

```
User Interaction (Click, Drag, Keyboard)
         │
         ▼
   ┌─────────────┐
   │    VIEW     │  HTML + CSS (Dark theme: #282A36)
   │  (index.html)│  Drag&drop, Tabindex, ARIA labels
   └──────┬──────┘
          │ events
          ▼
   ┌─────────────────────┐
   │   CONTROLLERS       │
   │ ┌─────────────────┐ │
   │ │AuthController   │ │ → JWT login
   │ │KanbanController │ │ → Drag&drop, keyboard nav
   │ │DashboardCtrl    │ │ → Widgets (Factory)
   │ │FilterController │ │ → Debounce filters
   │ │CommentsCtrl     │ │ → Comentarios + adjuntos
   │ └─────────────────┘ │
   └──────┬──────────────┘
          │ calls
          ▼
   ┌─────────────────────┐
   │     MODELS          │
   │ ┌─────────────────┐ │
   │ │TareaModel       │ │ → moveToState(), assignResponsible()
   │ │ProyectoModel    │ │ → loadTasks(), getStats(), getTareasByUser()
   │ │AuthModel        │ │ → login(), logout(), isAuthenticated
   │ │WidgetFactory    │ │ → create('pieChart'), create('overdueList')
   │ │ApiService       │ │ → GET, POST, PUT, DELETE
   │ └─────────────────┘ │
   └──────┬──────────────┘
          │ fetch()
          ▼
   Backend API (localhost:3000)
```

### Models (Captura datos + API)
- **TareaModel**: `moveToState()`, `assignResponsible()`, `addComment()`, `save()`, `delete()`
- **ProyectoModel**: `loadTasks()`, `loadStats()`, `getTareasByState()`, `getTareasByUser()`, `getOverdueTasks()`
- **AuthModel**: Singleton pattern, JWT en localStorage, `login()`, `logout()`, `isAuthenticated`
- **ApiService**: GET, POST, PUT, DELETE centralizados, maneja Authorization header
- **WidgetFactory**: Crea widgets reutilizables (pieChart, overdueList, taskStats, userLoad, priorityBar)

### Controllers (Maneja eventos + actualiza View)
- **KanbanController**: Drag&drop nativo + keyboard (arrow keys)
- **DashboardController**: Carga stats y renderiza widgets
- **AuthController**: Formulario de login, JWT handling
- **CommentsController**: Agregar comentarios + adjuntos (simulados)
- **FilterController**: Filtros por responsable/prioridad/búsqueda (debounce)
- **Observer pattern**: Models notifican cambios → Controllers re-renderizan

### Views (HTML + CSS)
- **index.html**: Entry point con divs para auth, main, dashboard
- **Dark theme**: BG `#282A36`, text `#F0F0F0`, accent `#61DAFB`
- **Responsive**: Media queries para mobile/tablet/desktop
- **Accesibilidad**: tabindex, aria-labels, role attributes
- **Drag&drop**: Glow effect, visual feedback

## ✅ Criterios de Aceptación Cumplidos

### CA1: "No mover a Done sin responsable asignado"
- ✅ Validación en dominio: `Tarea.cambiarEstado()` valida responsable
- ✅ Validación en aplicación: `TareaService.moveTask()` rechaza si no hay responsable
- ✅ Validación en API: `PUT /tareas/:id/move` retorna 400
- ✅ Test: `CommandsEdgeCases.test.ts` + `TareaServiceCriteria.test.ts`

### CA2: "Dashboard retorna overdue tasks priorizado por antigüedad"
- ✅ Identifica: `dueDate < now && state != DONE`
- ✅ Ordena: Las más antiguas primero (prioridad)
- ✅ Excluye: Tareas completadas (DONE)
- ✅ Stats: Total, completadas, pendientes, porcentaje
- ✅ Widget: Gráfico de pastel (SVG) + lista overdue + carga por usuario

### CA3: "Usuario debe pertenecer al proyecto para asignar"
- ✅ Validación: `ProyectoModel.team.includes(userId)`
- ✅ API: `PUT /tareas/:id/assign` verifica membership
- ✅ Test: `FilterController.test.ts`

### CA4: "Roles y permisos"
- ✅ ADMIN: Crea/edita proyectos, gestiona usuarios, ver todo
- ✅ LIDER: Crea proyectos, ve su equipo
- ✅ MIEMBRO: Solo tareas asignadas
- ✅ JWT: Token contiene role, autenticación en headers
- ✅ Middleware: `checkRole(UserRole.ADMIN)`

### CA5: "Comentarios con adjuntos"
- ✅ API: `POST /tareas/:id/comments` agrega comentario
- ✅ Adjuntos: Nombres de archivos + tamaño (simulado)
- ✅ UI: CommentsController renderiza lista

### CA6: "Notificaciones UI"
- ✅ Toast: success, error, info, warning (con iconos)
- ✅ Highlight: Overdue tasks en rojo
- ✅ On assign: Toast de éxito
- ✅ Auto-hide: 3-5 segundos según tipo

## Desacoplamiento de base de datos
La interfaz `ITaskRepository` en domain define métodos como `create(task)`, `findAll()`, etc. El adaptador `SQLiteRepositoryImpl` (infrastructure) implementa esa interfaz usando SQLite. 

**Cambiar a PostgreSQL**: Solo crear `PostgresRepositoryImpl` que implemente la misma interfaz. El rest del código NO cambia.

### Patrones utilizados
| Patrón | Uso |
|--------|-----|
| Hexagonal / Ports & Adapters | Separación dominio-infraestructura |
| Command | Encapsular comandos de modificación (CQRS básico) |
| MVC | Frontend (Model-View-Controller) |
| Factory Method | Creación de widgets del dashboard |
| Dependency Injection | Manual mediante constructor (simple) |

## Requisitos
- Node.js >= 18
- npm >= 9

## Instalación y ejecución
```bash
npm install
npm run dev
```
Esto inicia el backend en `http://localhost:3000` y el frontend (live-server) en `http://localhost:8080`.

## Scripts disponibles
| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Ejecuta backend y frontend en modo desarrollo |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm test` | Ejecuta pruebas Jest |
| `npm run start` | Inicia el servidor desde la compilación |
| `npm run swagger` | Genera documentación Swagger desde comentarios |

## Estructura de carpetas
```
/
├── backend/src/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── Task.ts
│   │   ├── repositories/
│   │   │   └── ITaskRepository.ts
│   │   └── commands/
│   │       └── CreateTaskCommand.ts
│   ├── application/
│   │   └── usecases/
│   │       └── CreateTaskUseCase.ts
│   └── infrastructure/
│       ├── adapters/
│       │   └── SQLiteTaskRepository.ts
│       ├── routes/
│       │   └── taskRoutes.ts
│       ├── server.ts
│       └── i18n/
├── frontend/src/
│   ├── models/
│   │   └── TaskModel.ts
│   ├── views/
│   │   └── index.html
│   ├── controllers/
│   │   └── TaskController.ts
│   └── assets/
│       └── styles.css
├── shared/
│   └── types/
│       └── common.ts
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
│   └── swagger.yaml
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## Pruebas
Jest configurado para pruebas unitarias (casos de uso) y de integración (adaptador SQLite). Ejecutar `npm test`.

## Documentación API
Swagger disponible en `http://localhost:3000/api-docs` cuando el servidor está en ejecución.

## Internacionalización
Soporta español e inglés mediante archivos JSON en `backend/src/infrastructure/i18n/`. Se detecta el idioma del navegador.