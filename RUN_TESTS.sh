#!/bin/bash

# Script para ejecutar tests del Sistema de Gestión de Tareas
# Uso: ./RUN_TESTS.sh [opción]

set -e

echo "================================"
echo "Sistema de Gestión de Tareas"
echo "Test Suite Runner"
echo "================================"
echo ""

if [ "$1" = "" ]; then
    echo "Opciones disponibles:"
    echo ""
    echo "  ./RUN_TESTS.sh all          - Todos los tests"
    echo "  ./RUN_TESTS.sh unit         - Solo tests unitarios"
    echo "  ./RUN_TESTS.sh integration  - Solo tests de integración"
    echo "  ./RUN_TESTS.sh domain       - Tests del dominio"
    echo "  ./RUN_TESTS.sh commands     - Tests de Commands (edge cases)"
    echo "  ./RUN_TESTS.sh services     - Tests de servicios"
    echo "  ./RUN_TESTS.sh api          - Tests de endpoints"
    echo "  ./RUN_TESTS.sh watch        - Watch mode (TDD)"
    echo "  ./RUN_TESTS.sh coverage     - Con reporte de coverage"
    echo ""
    exit 0
fi

case "$1" in
    all)
        echo "▶ Ejecutando TODOS los tests..."
        npm test
        ;;
    unit)
        echo "▶ Ejecutando tests UNITARIOS..."
        npm test -- tests/unit/
        ;;
    integration)
        echo "▶ Ejecutando tests de INTEGRACIÓN..."
        npm test -- tests/integration/
        ;;
    domain)
        echo "▶ Ejecutando tests del DOMINIO..."
        npm test -- tests/unit/domain/
        ;;
    commands)
        echo "▶ Ejecutando tests de COMMANDS (edge cases)..."
        npm test -- CommandsEdgeCases
        ;;
    services)
        echo "▶ Ejecutando tests de SERVICIOS..."
        npm test -- TareaService
        ;;
    api)
        echo "▶ Ejecutando tests de ENDPOINTS API..."
        npm test -- endpoints
        ;;
    watch)
        echo "▶ Iniciando WATCH MODE (TDD)..."
        npm test -- --watch
        ;;
    coverage)
        echo "▶ Ejecutando tests con COVERAGE..."
        npm test -- --coverage
        echo ""
        echo "📊 Reporte de coverage generado en: ./coverage/lcov-report/index.html"
        ;;
    *)
        echo "❌ Opción desconocida: $1"
        echo "Intenta: ./RUN_TESTS.sh all"
        exit 1
        ;;
esac

echo ""
echo "✅ Tests completados"
