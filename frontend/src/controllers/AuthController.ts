/**
 * Controlador de Autenticación - MVC Controller
 *
 * Maneja:
 * 1. Renderizado del formulario de login
 * 2. Eventos de submit
 * 3. Almacenamiento de token
 * 4. Redirección después de login
 */

import { authModel, IUsuario } from '../models';

type AuthStateListener = (user: IUsuario | null) => void;

export class AuthController {
  private containerElement: HTMLElement;
  private listeners: AuthStateListener[] = [];

  constructor(containerElement: HTMLElement) {
    this.containerElement = containerElement;

    // Escuchar cambios de autenticación
    authModel.onChange((user) => {
      if (user) {
        this.renderLoggedIn(user);
      } else {
        this.renderLoginForm();
      }
      this.notifyListeners();
    });

    // Renderizado inicial
    if (authModel.user) {
      this.renderLoggedIn(authModel.user);
    } else {
      this.renderLoginForm();
    }
  }

  /**
   * Renderiza el formulario de login
   */
  private renderLoginForm(): void {
    this.containerElement.innerHTML = `
      <div class="auth-container">
        <div class="login-box">
          <h1>Sistema de Gestión de Tareas</h1>
          <form class="login-form">
            <div class="form-group">
              <label for="email">Email:</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="ana@email.com"
                required
              />
            </div>
            <div class="form-group">
              <label for="password">Contraseña:</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="••••••••"
                required
              />
            </div>
            <div class="form-group">
              <label for="token">O pega tu JWT:</label>
              <textarea 
                id="token" 
                name="token" 
                placeholder="eyJhbGciOiJIUzI1NiIs..."
                rows="4"
              ></textarea>
            </div>
            <button type="submit" class="btn-primary">Ingresar</button>
          </form>
          <div class="test-tokens">
            <h4>Tokens de prueba:</h4>
            <button class="btn-test-token" data-role="MIEMBRO">Login como MIEMBRO</button>
            <button class="btn-test-token" data-role="ADMIN">Login como ADMIN</button>
          </div>
        </div>
      </div>
    `;

    this.attachLoginListeners();
  }

  /**
   * Renderiza vista logueado
   */
  private renderLoggedIn(user: IUsuario): void {
    this.containerElement.innerHTML = `
      <div class="auth-bar">
        <div class="user-info">
          <span class="user-name">👤 ${user.name}</span>
          <span class="user-role" data-role="${user.role}">${user.role}</span>
        </div>
        <button class="btn-logout">Logout</button>
      </div>
    `;

    this.containerElement.querySelector('.btn-logout')?.addEventListener('click', () => {
      authModel.logout();
    });
  }

  /**
   * Adjunta listeners al formulario de login
   */
  private attachLoginListeners(): void {
    const form = this.containerElement.querySelector('.login-form') as HTMLFormElement;
    const tokenInput = this.containerElement.querySelector('#token') as HTMLTextAreaElement;
    const testTokenBtns = this.containerElement.querySelectorAll('.btn-test-token');

    // Envío del formulario
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = tokenInput.value.trim();
      if (!token) {
        alert('Por favor pega un JWT válido o usa los botones de prueba');
        return;
      }

      const success = await authModel.login(token);
      if (!success) {
        alert('❌ Token inválido. Verifica que sea un JWT válido.');
      }
    });

    // Botones de tokens de prueba
    testTokenBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const role = (btn as HTMLElement).dataset.role as string;
        this.generateTestToken(role);
      });
    });
  }

  /**
   * Genera un token JWT de prueba
   * En producción, esto vendría del backend
   */
  private generateTestToken(role: string): void {
    // Simulación: En realidad, el token vendría del backend
    // Para desarrollo, usamos un token hardcoded
    const testTokens: Record<string, string> = {
      MIEMBRO: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InUxIiwibmFtZSI6IkFuYSBHYXLDrWEiLCJlbWFpbCI6ImFuYUBlbWFpbC5jb20iLCJyb2xlIjoiTUlFTUJSTyIsImlhdCI6MTcwNTMyNjAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.XXXXX',
      ADMIN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InUtYWRtaW4iLCJuYW1lIjoiQWRtaW4iLCJlbWFpbCI6ImFkbWluQGVtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTcwNTMyNjAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.XXXXX'
    };

    const token = testTokens[role];
    if (!token) {
      alert('❌ Role de prueba no disponible');
      return;
    }

    const tokenInput = this.containerElement.querySelector('#token') as HTMLTextAreaElement;
    tokenInput.value = token;
    alert(`✅ Token de ${role} copiado. Haz click en "Ingresar"`);
  }

  /**
   * Observer pattern - suscribirse a cambios de auth
   */
  onChange(listener: AuthStateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const user = authModel.user;
    this.listeners.forEach(listener => listener(user));
  }

  /**
   * Getter para estado de autenticación
   */
  get isAuthenticated(): boolean {
    return authModel.isAuthenticated;
  }
}
