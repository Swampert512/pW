dZC# 🚀 Comienza aquí - Ejecutar los Tests

## Paso 1: Instalar dependencias (primera vez)

```bash
npm install
```

## Paso 2: Ejecutar los tests

### Opción A: Todos los tests (recomendado)
```bash
npm test
```

**Resultado esperado:**
```
Test Suites: 13 passed, 13 total
Tests:       150+ passed, 150+ total
Time:        12.456s ✅
```

### Opción B: Watch mode (para desarrollo)
```bash
npm test -- --watch
```

**Comportamiento:**
- Ejecuta tests
- Espera cambios en archivos
- Re-ejecuta tests automáticamente
- Perfecto para TDD

### Opción C: Con coverage
```bash
npm test -- --coverage
```

**Genera reporte en `coverage/` con:**
- % de líneas cubiertas
- % de branches cubiertas
- % de funciones cubiertas

---

## Paso 3: Ver tests específicos

### Tests de edge cases (lo más interesante)
```bash
npm test -- CommandsEdgeCases
```

Valida:
- ✅ No permitir dueDate pasado
- ✅ Rechazar título vacío
- ✅ Transiciones inválidas de estado
- ✅ Undo/Redo funcionan

### Tests de criterios de aceptación
```bash
npm test -- Criteria
```

Valida:
- ✅ CA1: No mover a Done sin responsable
- ✅ CA2: Dashboard retorna overdue priorizado
- ✅ CA3: Usuario pertenece al proyecto

### Tests de API (endpoints REST)
```bash
npm test -- endpoints
```

Valida:
- ✅ Autenticación (401 sin token)
- ✅ Autorización (403 sin roles)
- ✅ Respuestas HTTP correctas

---

## Paso 4: Entender los resultados

### ✅ Si todos los tests pasan
```
PASS  tests/unit/domain/Tarea.test.ts
PASS  tests/unit/domain/commands/CommandsEdgeCases.test.ts
PASS  tests/integration/endpoints.test.ts

✓ 150 tests passed
```

→ **Felicidades!** El código está correcto.

### ❌ Si un test falla
```
FAIL  tests/unit/domain/Tarea.test.ts

● Tarea › debería rechazar dueDate pasado

  Expected: "debe ser futura"
  Received: undefined
```

→ **Acción:** Revisar que la validación esté implementada.

---

## Tests clave explicados

### Test 1: CrearTareaCommand - Validar dueDate futura

```typescript
// ¿Por qué este test?
// - Previene crear tareas con fechas pasadas
// - Es imposible violarla (test lo asegura)

it('debería rechazar dueDate pasado', () => {
  const pastDate = new Date('2024-01-01');
  const command = new CrearTareaCommand('Tarea', 'Desc', 'proj-1', pastDate);
  
  expect(() => command.execute()).toThrow('debe ser futura');
});
```

### Test 2: MoverTareaCommand - Transiciones válidas

```typescript
// ¿Por qué este test?
// - Define la máquina de estados de Tarea
// - Evita estados inconsistentes

it('NO debería permitir TODO → DONE directamente', () => {
  const tarea = new Tarea('t1', 'T', 'D', 'proj-1', null, futureDate);
  const command = new MoverTareaCommand(tarea, TaskState.DONE);
  
  expect(() => command.execute()).toThrow('Transición inválida');
});

// Camino válido: TODO → IN_PROGRESS → TESTING → DONE
```

### Test 3: TareaService - No Done sin responsable

```typescript
// ¿Por qué este test?
// - Regla de negocio: no puedo marcar completada sin quien la hizo
// - Se valida en APLICACIÓN (no solo dominio)

it('debería rechazar moveTask a DONE sin responsable', async () => {
  const tarea = new Tarea('t1', 'Sin dueño', 'D', 'proj-1', null, futureDate);
  const command = new MoverTareaCommand(tarea, TaskState.DONE);
  
  await expect(service.moveTask(command)).rejects.toThrow('sin responsable');
});
```

### Test 4: Dashboard - Overdue priorizado

```typescript
// ¿Por qué este test?
// - Usuarios necesitan ver qué está más atrasado PRIMERO
// - Ordena por antigüedad (más urgente primero)

it('debería ordenar overdue tasks por fecha', async () => {
  const hace30Dias = new Date(Date.now() - 30 * 86400000);
  const hace5Dias = new Date(Date.now() - 5 * 86400000);
  
  const t1 = new Tarea('t1', 'Hace 30 días', ..., hace30Dias);
  const t2 = new Tarea('t2', 'Hace 5 días', ..., hace5Dias);
  
  const stats = await service.getDashboardStats('proj-1');
  
  // t1 primero (más urgente)
  expect(stats.overdueTasks[0].id).toBe('t1');
  expect(stats.overdueTasks[1].id).toBe('t2');
});
```

### Test 5: API - Autenticación

```typescript
// ¿Por qué este test?
// - Seguridad: sin token = no acceso
// - Valida que middleware funciona

it('debería rechazar POST sin autenticación (401)', async () => {
  const res = await request(app)
    .post('/api/proyectos')
    .send({ name: 'Proyecto' });
  
  expect(res.status).toBe(401);
  expect(res.body.error).toContain('Token');
});
```

---

## Flujo de un test

```
1. SETUP (beforeEach)
   └─ Crear mocks
   └─ Instanciar servicios
   └─ Preparar datos de prueba

2. TEST (it)
   ├─ ARRANGE: Preparar condición
   │  └─ new CrearTareaCommand(...)
   ├─ ACT: Ejecutar acción
   │  └─ command.execute()
   └─ ASSERT: Verificar resultado
      └─ expect(...).toThrow(...)

3. TEARDOWN (afterEach)
   └─ Limpiar mocks
   └─ Cerrar conexiones
```

---

## Comandos útiles

```bash
# Ver todos los tests disponibles
npm test -- --listTests

# Ejecutar solo tests que mencionen "overdue"
npm test -- --testNamePattern="overdue"

# Ejecutar un describe block completo
npm test -- --testNamePattern="CA1"

# Debug: ver qué test se ejecuta (verbose)
npm test -- --verbose

# Debug: pausar en breakpoints
node --inspect-brk ./node_modules/.bin/jest --runInBand
# Luego abre: chrome://inspect
```

---

## Problemas comunes

### ❌ "Port 3000 is already in use"
```bash
# Cambiar puerto
PORT=3001 npm test
```

### ❌ "Cannot find module 'jest'"
```bash
npm install
```

### ❌ "Tests are hanging"
```bash
# Aumentar timeout
npm test -- --testTimeout=10000
```

### ❌ "Database locked"
```bash
# Ejecutar en serie (no paralelo)
npm test -- --runInBand
```

---

## Checklist antes de commit

- [ ] `npm test` pasa (todos los tests ✅)
- [ ] Coverage >80% (`npm test -- --coverage`)
- [ ] Sin errores TypeScript (`npm run build`)
- [ ] Tests documentan el comportamiento

---

## Resumen

| Tipo de test | Ubicación | Propósito | Velocidad |
|------|-----------|-----------|----------|
| **Unit** | `tests/unit/domain/` | Validar reglas de dominio | 📍 Rápido (1-2s) |
| **Unit** | `tests/unit/application/` | Validar lógica de app | 📍 Rápido (1-2s) |
| **Integration** | `tests/integration/` | Validar BD + API | 🐌 Lento (8-10s) |

**Total: ~150 tests en ~12 segundos**

---

## ¿Qué es lo más importante?

1. **Tests de dominio** (CommandsEdgeCases)
   - Validan reglas de negocio fundamentales
   - Si fallan, TODO falla
   - Ejecutalos primero: `npm test -- CommandsEdgeCases`

2. **Tests de criterios** (TareaServiceCriteria)
   - Validan que CA se cumplen
   - Si fallan, el cliente no está satisfecho
   - Ejecutalos segundo: `npm test -- Criteria`

3. **Tests de API** (endpoints)
   - Validan que el sistema es usable
   - Si fallan, la app no funciona
   - Ejecutalos tercero: `npm test -- endpoints`

---

## 🎯 Conclusión

**Tests no son lujo, son necesidad.**

Cada test que escribes hoy = 10 horas de debugging que evitas mañana.

¡Ahora: `npm test` 🚀
