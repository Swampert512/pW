/**
 * Modelo de Autenticación - Maneja login y JWT token
 *
 * Responsabilidades:
 * 1. Almacenar token en localStorage
 * 2. Extraer información del usuario del JWT
 * 3. Validar si usuario está autenticado
 * 4. Manejar logout
 */

import { IJwtPayload, IUsuario, UserRole } from './types';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

export class AuthModel {
  private static instance: AuthModel;
  private currentUser: IUsuario | null = null;
  private token: string | null = null;
  private listeners: Array<(user: IUsuario | null) => void> = [];

  private constructor() {
    this.loadFromStorage();
  }

  /**
   * Singleton pattern - obtiene la instancia única
   */
  static getInstance(): AuthModel {
    if (!AuthModel.instance) {
      AuthModel.instance = new AuthModel();
    }
    return AuthModel.instance;
  }

  // --- Getters ---

  get isAuthenticated(): boolean {
    return this.token !== null && this.currentUser !== null;
  }

  get user(): IUsuario | null {
    return this.currentUser;
  }

  get getToken(): string | null {
    return this.token;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  get isLider(): boolean {
    return this.currentUser?.role === 'LIDER';
  }

  // --- Métodos de autenticación ---

  /**
   * Simula login (en producción sería contra API de login)
   * Por ahora aceptamos un token JWT directamente
   */
  async login(token: string): Promise<boolean> {
    try {
      // Decodificar JWT (sin verificar firma en frontend)
      const user = this.decodeToken(token);
      if (!user) {
        console.error('Token inválido');
        return false;
      }

      this.token = token;
      this.currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      this.saveToStorage();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  }

  /**
   * Logout - limpia autenticación
   */
  logout(): void {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.notifyListeners();
  }

  /**
   * Verifica si el token aún es válido
   */
  isTokenExpired(): boolean {
    if (!this.token) return true;

    const decoded = this.decodeToken(this.token);
    if (!decoded) return true;

    const expiryTime = decoded.exp * 1000; // Convertir a ms
    return Date.now() > expiryTime;
  }

  /**
   * Decodifica un JWT (solo payload, sin verificación)
   * NOTA: En frontend no se puede verificar la firma.
   * Confiar en que el backend la verificó.
   */
  private decodeToken(token: string): IJwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = parts[1];
      const decoded = JSON.parse(atob(payload));
      return decoded as IJwtPayload;
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }

  // --- Persistencia en localStorage ---

  private saveToStorage(): void {
    if (this.token) {
      localStorage.setItem(TOKEN_KEY, this.token);
    }
    if (this.currentUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
    }
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);

    if (token && userJson) {
      // Verificar que token no haya expirado
      const decoded = this.decodeToken(token);
      if (decoded && Date.now() < decoded.exp * 1000) {
        this.token = token;
        this.currentUser = JSON.parse(userJson);
      } else {
        // Token expirado - limpiar
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  }

  // --- Observer pattern ---

  /**
   * Se suscribe a cambios de autenticación
   */
  onChange(listener: (user: IUsuario | null) => void): () => void {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

// Exportar instancia singleton
export const authModel = AuthModel.getInstance();
