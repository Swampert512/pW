/**
 * Servicio de API - Centraliza todas las llamadas HTTP
 * Maneja autenticación, headers, errores, etc.
 *
 * SRP: Solo se encarga de comunicación con backend
 */
import { IApiResponse } from './types';

const API_BASE_URL = 'http://localhost:3000/api';

export class ApiService {
  /**
   * Obtiene el token JWT del localStorage
   */
  private static getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Obtiene headers estándar con autenticación
   */
  private static getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * GET genérico
   */
  static async get<T>(endpoint: string): Promise<IApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Error en la solicitud' };
      }

      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * POST genérico
   */
  static async post<T>(endpoint: string, body: any): Promise<IApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Error en la solicitud' };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * PUT genérico
   */
  static async put<T>(endpoint: string, body: any): Promise<IApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Error en la solicitud' };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * DELETE genérico
   */
  static async delete(endpoint: string): Promise<IApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Error en la solicitud' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
