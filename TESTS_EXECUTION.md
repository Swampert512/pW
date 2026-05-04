# Ejecución de Tests - Guía práctica

## Instalación de dependencias (si no lo hizo)

```bash
npm install
```

---

## 1. Ejecutar TODOS los tests

```bash
npm test
```

**Salida esperada:**
```
PASS  tests/unit/domain/Tarea.test.ts
PASS  tests/unit/domain/Proyecto.test.ts
PASS  tests/unit/domain/Usuario.test.ts
PASS  tests/unit/domain/commands/CrearTareaCommand.test.ts
PASS  tests/unit/domain/commands/MoverTareaCommand.test.ts
PASS  tests/unit/domain/commands/AsignarResponsableCommand.test.ts
PASS  tests/unit/domain/commands/CommandsEdgeCases.test.ts (NEW)
PASS  tests/unit/application/TareaService.test.ts
PASS  tests/unit/application/TareaServiceCriteria.test.ts (NEW)
PASS  tests/unit/CreateTaskUseCase.test.ts
PASS  tests/integration/SQLiteTaskRepository.test.ts
PASS  tests/integration/ProyectoService.test.ts
PASS  tests/integration/endpoints.test.ts (NEW)

Test Suites: 13 passed, 13 total
Tests:       150 passed, 150 total
Snapshots:   0 total
Time:        12.456s
```

---

## 2. Ejecutar solo tests unitarios (sin integración)

```bash
npm test -- tests/unit/
```

**Más rápido (5-6 segundos)** porque no toca BD.

---

## 3. Ejecutar solo tests de integración

```bash
npm test -- tests/integration/
```

**Más lento** (8-10 segundos) porque crea BD real.

---

## 4. Ejecutar tests de un archivo específico

### Tests del dominio Tarea
```bash
npm test -- Tarea.test
```

### Tests de Commands (edge cases)
```bash
npm test -- CommandsEdgeCases
```

### Tests de criterios de aceptación
```bash
npm test -- Criteria
```

### Tests de endpoints API
```bash
npm test -- endpoints
```

---

## 5. Ejecutar en watch mode (durante desarrollo)

```bash
npm test -- --watch
```

**Comportamiento:**
- Ejecuta todos los tests
- Espera a que guardes archivos
- Re-ejecuta solo tests afectados
- Presiona `a` para re-ejecutar todos
- Presiona `q` para salir

**Ideal para:** TDD (escribir test → hacerlo pasar → refactorizar)

---

## 6. Ejecutar con coverage

```bash
npm test -- --coverage
```

**Output:**
```
--------|----------|----------|----------|----------|----------------|
File    | % Stmts  | % Branch | % Funcs  | % Lines  | Uncovered Line |
--------|----------|----------|----------|----------|----------------|
All     |   85.2   |   80.5   |   90.1   |   85.2   |                |
--------|----------|----------|----------|----------|----------------|
```

**Genera carpeta `coverage/` con reporte HTML:**
```bash
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage/lcov-report/index.html  # Windows
```

---

## 7. Ejecutar tests de un patrón específico

### Solo tests que mencionen "overdue"
```bash
npm test -- --testNamePattern="overdue"
```

### Solo tests que mencionen "responsable"
```bash
npm test -- --testNamePattern="responsable"
```

### Solo tests de autenticación
```bash
npm test -- --testNamePattern="auth|autenticación"
```

---

## 8. Ejecutar un solo describe block

```bash
npm test -- --testNamePattern="CA1"
```

Ejecutará solo el describe "CA1: No mover a Done sin responsable".

---

## 9. Debug de un test fallido

```bash
# Modo verbose
npm test -- --verbose

# Modo debug (pausar en breakpoints)
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

Luego abre:
```
chrome://inspect
```

---

## 10. Ejemplos prácticos

### Desarrollo: Trabajar en Commands
```bash
npm test -- CommandsEdgeCases --watch
```

Cada vez que edites `CrearTareaCommand.ts`, los tests se re-ejecutan.

### Pre-commit: Verificar todo
```bash
npm test -- --coverage
```

Asegúrate de tener >80% coverage antes de mergear.

### CI/CD: Run full suite
```bash
npm test -- --ci --coverage --maxWorkers=2
```

---

## 11. Solucionar problemas

### Error: "Cannot find module 'jest'"
```bash
npm install
npm test
```

### Error: "Tests are hanging"
```bash
# Aumentar timeout
npm test -- --testTimeout=10000
```

### Error: "Database locked (SQLITE_BUSY)"
```bash
# Ejecutar tests en serie (no paralelo)
npm test -- --runInBand
```

### Error: "Token inválido en tests"
```bash
# Verificar que JWT_SECRET sea consistent
echo $JWT_SECRET  # Debe ser 'dev-secret-key' en tests
```

---

## 12. Ver qué tests existen

```bash
npm test -- --listTests
```

Muestra todos los archivos de test:
```
tests/unit/domain/Tarea.test.ts
tests/unit/domain/Proyecto.test.ts
tests/unit/domain/Usuario.test.ts
tests/unit/domain/commands/CrearTareaCommand.test.ts
tests/unit/domain/commands/MoverTareaCommand.test.ts
tests/unit/domain/commands/AsignarResponsableCommand.test.ts
tests/unit/domain/commands/CommandsEdgeCases.test.ts
tests/unit/application/TareaService.test.ts
tests/unit/application/TareaServiceCriteria.test.ts
tests/unit/CreateTaskUseCase.test.ts
tests/integration/SQLiteTaskRepository.test.ts
tests/integration/ProyectoService.test.ts
tests/integration/endpoints.test.ts
```

---

## 13. Flujo de trabajo recomendado

### Paso 1: Escribir el test primero (TDD)
```bash
npm test -- --watch
# Archivo de test abierto
# Escribo: it('debería rechazar dueDate pasado', () => { ... })
# Test falla (RED)
```

### Paso 2: Implementar lo mínimo para pasar
```typescript
// En CrearTareaCommand.ts
if (this.dueDate < new Date()) {
  throw new Error('La fecha debe ser futura');
}
// Test pasa (GREEN)
```

### Paso 3: Refactorizar
```typescript
// Mejorar mensajes, documentar, etc.
// Tests siguen pasando (REFACTOR)
```

### Paso 4: Commit
```bash
npm test -- --coverage
# Verificar que coverage > 80%
git add .
git commit -m "feat: validar dueDate futura en CrearTareaCommand"
```

---

## 14. Métricas de tests

### Contar tests por archivo
```bash
grep -r "it('" tests/ | wc -l
# Output: 150 tests
```

### Ver tiempo de ejecución por test
```bash
npm test -- --verbose
```

### Encontrar tests lentos
```bash
npm test -- --maxWorkers=1  # Ejecutar en serie
```

---

## 15. Integración con CI/CD (GitHub Actions)

**Crear `.github/workflows/tests.yml`:**

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

Cada push ejecuta tests automáticamente.

---

## Checklist pre-commit

Antes de hacer commit:

- [ ] `npm test` pasa (todos los tests)
- [ ] `npm test -- --coverage` muestra >80%
- [ ] No hay warnings de TypeScript (`npm run build`)
- [ ] Código formateado (`npm run format` si existe)
- [ ] Tests documentan el comportamiento esperado

---

## Recursos útiles

- Jest docs: https://jestjs.io/
- Supertest: https://github.com/visionmedia/supertest
- Testing library: https://testing-library.com/
- Coverage badges: https://shields.io/
