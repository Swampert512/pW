# Resumen de Pruebas - Sistema de Gestión de Tareas

## Estructura de Tests

```
tests/
├── unit/
│   ├── domain/
│   │   ├── Tarea.test.ts               (15 tests - entidad Tarea)
│   │   ├── Proyecto.test.ts            (10 tests - entidad Proyecto)
│   │   ├── Usuario.test.ts             (8 tests - entidad Usuario)
│   │   └── commands/
│   │       ├── CrearTareaCommand.test.ts         (8 tests)
│   │       ├── MoverTareaCommand.test.ts         (9 tests)
│   │       ├── AsignarResponsableCommand.test.ts (7 tests)
│   │       └── CommandsEdgeCases.test.ts         (NEW - 20+ tests)
│   ├── application/
│   │   ├── TareaService.test.ts        (25+ tests)
│   │   └── TareaServiceCriteria.test.ts (NEW - 15+ tests criterios aceptación)
│   └── CreateTaskUseCase.test.ts       (5 tests - legacy)
│
└── integration/
    ├── ProyectoService.test.ts         (Tests con BD)
    ├── SQLiteTaskRepository.test.ts    (Tests CRUD SQLite)
    └── endpoints.test.ts               (NEW - 15+ tests API)

TOTAL: ~150+ tests
```

---

## ¿Por qué pruebas unitarias para Commands?

### Problema sin tests
```
CrearTareaCommand.execute()
  ├─ ¿Valida dueDate futura?
  ├─ ¿Rechaza título vacío?
  ├─ ¿Inicia en estado TODO?
  └─ ¿Genera IDs únicos?

Sin tests → Bugs en producción
```

### Solución con tests
```typescript
// tests/unit/domain/commands/CommandsEdgeCases.test.ts

it('debería rechazar dueDate pasado', () => {
  const command = new CrearTareaCommand('T', 'D', 'p1', pastDate);
  expect(() => command.execute()).toThrow('debe ser futura');
});
```

**¿Por qué aquí y no en la aplicación?**

1. **Las reglas de dominio son fundamentales**
   - Si falla la validación de Command, TODA la app falla
   - Es mejor fallar en unit tests (10ms) que en producción (customers angry 😤)

2. **Reutilizable en múltiples contextos**
   - El mismo Command se usa en:
     - API REST (/api/tareas POST)
     - CLI (si la hay)
     - Eventos (queue de comandos)
   - Testear el Command una sola vez = cobertura para todos

3. **Auditoría y trazabilidad**
   - Cada Command tiene `toJSON()` para logging
   - Si no testeo que `toJSON()` devuelve datos correctos, los logs son inútiles

---

## Criterios de Aceptación cubiertos

### CA1: "No mover a Done sin responsable"

```typescript
// tests/unit/TareaServiceCriteria.test.ts

it('debería rechazar moveTask a DONE si no hay responsable', async () => {
  const tarea = new Tarea('t1', 'Sin dueño', 'Desc', 'proj-1', null, futureDate);
  const command = new MoverTareaCommand(tarea, TaskState.DONE);
  
  await expect(service.moveTask(command)).rejects.toThrow('sin responsable');
});
```

**¿Dónde se valida?**
- Dominio: `Tarea.cambiarEstado()` lanza error si invalid
- Aplicación: `TareaService.moveTask()` agrega check adicional
- Result: Double-checked, imposible violar

### CA2: "Dashboard retorna overdue tasks ordenadas"

```typescript
it('debería ordenar overdue tasks por fecha (más antiguas primero)', async () => {
  const t1 = new Tarea('t1', 'Vencida hace 30 días', ...);
  const t2 = new Tarea('t2', 'Vencida hace 5 días', ...);
  const t3 = new Tarea('t3', 'Vencida hace 15 días', ...);
  
  mockTareaRepo.findAll.mockResolvedValue([t2, t3, t1]); // Orden random
  const stats = await service.getDashboardStats('proj-1');
  
  expect(stats.overdueTasks[0].id).toBe('t1');  // 30 días
  expect(stats.overdueTasks[1].id).toBe('t3');  // 15 días
  expect(stats.overdueTasks[2].id).toBe('t2');  // 5 días
});
```

**¿Qué prueba?**
- ✅ Identifica tareas vencidas (dueDate < now)
- ✅ Excluye tareas DONE (no cuentan como vencidas)
- ✅ Las ordena ascendentemente por fecha (más urgentes primero)

### CA3: "Usuario debe pertenecer al proyecto para asignar"

```typescript
it('debería rechazar asignación si usuario NO pertenece', async () => {
  const usuarioExterno = new Usuario('ext', ...);
  mockProyectoRepo.findById.mockResolvedValue(proyecto);
  // proyecto.tieneMiembro('ext') → false
  
  const command = new AsignarResponsableCommand(tarea, usuarioExterno);
  await expect(service.assignResponsible(command)).rejects.toThrow('no pertenece');
});
```

---

## Transacciones en Tests

### ¿Por qué las transacciones son críticas?

**Escenario sin transacciones:**
```
1. INSERT INTO tareas (...)
2. Algo falla ← Tarea queda a medias en BD
3. BD inconsistente
```

**Con transacciones:**
```
BEGIN TRANSACTION
  1. INSERT INTO tareas (...)
  2. INSERT INTO audit_log (...)
  Si ERROR → ROLLBACK (ambas se revierten)
  Si OK → COMMIT (ambas se guardan)
```

**Test que lo valida:**
```typescript
// tests/integration/SQLiteTaskRepository.test.ts

it('debería revertir si falla en medio de transacción', async () => {
  const repo = new TareaRepositoryImpl();
  
  try {
    await transaction(async (db) => {
      await db.run(`INSERT INTO tareas ...`);
      throw new Error('Algo falla'); // ← Simular error
    });
  } catch (e) {
    // Se ejecutó ROLLBACK automáticamente
  }
  
  // Verificar que nada se guardó
  const found = await repo.findById('t1');
  expect(found).toBeNull();
});
```

---

## Tests de API (Integration)

### Endpoint: POST /api/proyectos

```typescript
// tests/integration/endpoints.test.ts

it('debería rechazar sin autenticación (401)', async () => {
  const res = await request(app)
    .post('/api/proyectos')
    .send({ name: 'Proyecto' });
  
  expect(res.status).toBe(401);
  expect(res.body.error).toContain('Token');
});

it('debería crear con token válido (201)', async () => {
  const token = generateToken({
    id: 'u1',
    name: 'Ana',
    email: 'ana@email.com',
    role: UserRole.MIEMBRO
  });
  
  const res = await request(app)
    .post('/api/proyectos')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Mi Proyecto' });
  
  expect(res.status).toBe(201);
  expect(res.body.data.name).toBe('Mi Proyecto');
});
```

**Qué valida:**
- ✅ Middleware de auth funciona
- ✅ JWT se verifica correctamente
- ✅ Respuesta tiene estructura correcta
- ✅ Códigos HTTP son correctos

### Endpoint: PUT /api/proyectos/:id/archive (solo ADMIN)

```typescript
it('debería rechazar MIEMBRO (403)', async () => {
  const memberToken = generateToken({
    role: UserRole.MIEMBRO // No es ADMIN
  });
  
  const res = await request(app)
    .put('/api/proyectos/proj-1/archive')
    .set('Authorization', `Bearer ${memberToken}`);
  
  expect(res.status).toBe(403); // Forbidden
});

it('debería permitir ADMIN (200)', async () => {
  const adminToken = generateToken({
    role: UserRole.ADMIN
  });
  
  const res = await request(app)
    .put('/api/proyectos/proj-1/archive')
    .set('Authorization', `Bearer ${adminToken}`);
  
  expect(res.status).toBe(200);
});
```

---

## Cómo ejecutar

### Todos los tests
```bash
npm test
```

**Output esperado:**
```
Test Suites: 12 passed, 12 total
Tests:       150 passed, 150 total
Snapshots:   0 total
Time:        8.234 s
```

### Tests específicos
```bash
# Solo domain
npm test -- tests/unit/domain/

# Solo commands
npm test -- CommandsEdgeCases

# Solo criteria
npm test -- Criteria

# Solo API
npm test -- endpoints

# Con coverage
npm test -- --coverage
```

### Watch mode (durante desarrollo)
```bash
npm test -- --watch
```

---

## Edge Cases cubiertos

### ✅ Tarea sin responsable NO a Done
- ❌ moveTask(DONE) → throw error
- ✅ moveTask(TODO→IN_PROGRESS) → OK
- ✅ moveTask(IN_PROGRESS→TODO) → OK

### ✅ Overdue filtering
- Identifica: dueDate < now && state != DONE
- Ordena: fecha más antigua primero (prioridad)
- Cuenta: loadByUser solo tareas pendientes

### ✅ Transiciones inválidas de estado
- ❌ TODO→TESTING (salta IN_PROGRESS)
- ❌ DONE→cualquier estado (terminal)
- ✅ TODO→IN_PROGRESS→TESTING→DONE (camino válido)
- ✅ IN_PROGRESS→TODO (retroceso permitido)

### ✅ Validaciones de Command
- ❌ Título vacío
- ❌ Título solo whitespace
- ❌ dueDate pasado
- ✅ dueDate futuro (1+ segundo)

### ✅ Autorización
- ❌ Sin token → 401
- ❌ Token inválido → 401
- ❌ MIEMBRO intentando /archive (ADMIN) → 403
- ✅ Token válido + roles correctos → 200

---

## Coverage target

```
Statements   : 85% ( 340/400 )
Branches     : 80% ( 120/150 )
Functions    : 90% ( 45/50 )
Lines        : 85% ( 340/400 )
```

Ejecutar con:
```bash
npm test -- --coverage
```

---

## Flujo de una prueba completa

**Test: Crear tarea y verificar dashboard**

```typescript
1. SETUP
   - Crear mocks de repositorios
   - Instanciar servicio con mocks
   - Generar datos de prueba

2. ACT (Acción)
   - Crear comando CrearTareaCommand
   - Llamar service.createTask(command)
   - Retorna Tarea guardada

3. ASSERT (Verificación)
   - Tarea tiene ID único
   - Estado inicial es TODO
   - Responsable es el asignado
   - Mock.save fue llamado

4. VERIFY DASHBOARD
   - Mock.findAll retorna todas las tareas
   - getDashboardStats() filtra correctamente
   - Overdue tasks están ordenadas
   - loadByUser es correcto
```

---

## Conclusión

**Tests = Documentación ejecutable**

Cada test es un ejemplo de cómo DEBE funcionar el sistema. Cuando alguien pregunta:
- "¿Qué pasa si intento mover a Done sin responsable?"
- → Mira `CommandsEdgeCases.test.ts` 👈

**Tests = Red de seguridad**

Refactorizar código con confianza porque si algo se rompe, los tests te lo dicen inmediatamente.

**Tests = Criterios de aceptación**

Cada CA tiene su test equivalente que se ejecuta antes de mergear a main.
