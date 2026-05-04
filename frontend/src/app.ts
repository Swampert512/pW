/**
 * Aplicación principal - MVC App
 *
 * Integra:
 * - AuthController: Gestiona login
 * - ProyectoController: Renderiza proyecto y tareas
 * - Models: Mantienen estado sincronizado con backend
 *
 * Flujo:
 * 1. Usuario abre la app
 * 2. AuthController muestra formulario de login
 * 3. Usuario ingresa JWT
 * 4. AuthModel guarda token en localStorage
 * 5. ProyectoController carga datos del backend
 * 6. Models notifican cambios a Controllers
 * 7. Controllers re-renderizan vistas
 */

import { AuthController } from './controllers';
import { ProyectoController } from './controllers';
import { ProyectoModel, authModel } from './models';

class App {
  private authController: AuthController | null = null;
  private proyectoController: ProyectoController | null = null;
  private authContainer: HTMLElement;
  private mainContainer: HTMLElement;

  constructor() {
    this.authContainer = document.getElementById('auth') || document.createElement('div');
    this.mainContainer = document.getElementById('main') || document.createElement('div');

    this.initialize();
  }

  private initialize(): void {
    // Crear controlador de autenticación
    this.authController = new AuthController(this.authContainer);

    // Escuchar cambios de autenticación
    this.authController.onChange((user) => {
      if (user) {
        this.handleLoggedIn();
      } else {
        this.handleLoggedOut();
      }
    });

    // Si ya está autenticado, mostrar proyecto
    if (authModel.isAuthenticated) {
      this.handleLoggedIn();
    }
  }

  /**
   * Usuario logueado: cargar proyecto
   */
  private async handleLoggedIn(): Promise<void> {
    console.log('✅ Usuario autenticado:', authModel.user?.name);

    // Crear proyecto de ejemplo
    const proyectoData = {
      id: 'proj-demo',
      name: 'Proyecto Demo',
      description: 'Proyecto de demostración del sistema',
      team: authModel.user ? [authModel.user] : [],
      archived: false
    };

    const proyecto = new ProyectoModel(proyectoData);
    this.proyectoController = new ProyectoController(proyecto, this.mainContainer);

    // Inicializar carga de datos
    await this.proyectoController.initialize();
  }

  /**
   * Usuario deslogueado: limpiar proyecto
   */
  private handleLoggedOut(): void {
    console.log('❌ Usuario deslogueado');
    this.mainContainer.innerHTML = '';
    this.proyectoController = null;
  }
}

// Iniciar app cuando DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Iniciando aplicación...');
  new App();
});
