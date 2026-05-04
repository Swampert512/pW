/**
 * CommentsController - Gestiona comentarios en tareas
 *
 * Responsabilidades:
 * 1. Añadir comentarios a través de API
 * 2. Renderizar lista de comentarios
 * 3. Soporte para adjuntos simulados (nombres de archivos)
 * 4. Notificaciones de éxito/error
 */

import { TareaModel } from '../models';
import { Toast } from '../utils/Toast';
import { debounce } from '../utils/helpers';
import { i18n } from '../utils/i18n';

export class CommentsController {
  private tarea: TareaModel;
  private containerElement: HTMLElement;
  private commentsListElement: HTMLElement;
  private inputElement: HTMLTextAreaElement;
  private fileInput: HTMLInputElement;

  constructor(tarea: TareaModel, containerElement: HTMLElement) {
    this.tarea = tarea;
    this.containerElement = containerElement;

    this.createLayout();
    this.commentsListElement = this.containerElement.querySelector('.comments-list') as HTMLElement;
    this.inputElement = this.containerElement.querySelector('.comment-input') as HTMLTextAreaElement;
    this.fileInput = this.containerElement.querySelector('.file-input') as HTMLInputElement;

    this.attachListeners();
    this.renderComments();

    // Re-renderizar cuando la tarea cambia
    this.tarea.onChange(() => this.renderComments());
  }

  /**
   * Crea la estructura del controlador
   */
  private createLayout(): void {
    this.containerElement.innerHTML = `
      <div class="comments-section">
        <div class="comments-header">
          <h4>💬 Comentarios</h4>
          <span class="comment-count" aria-label="Número de comentarios">
            ${this.tarea.comments.length}
          </span>
        </div>

        <div class="comments-list"></div>

        <div class="comment-input-section">
          <textarea
            class="comment-input"
            placeholder="${i18n.t('comentarios.placeholder', 'Escribe un comentario...')}"
            rows="3"
            aria-label="Nuevo comentario"
          ></textarea>

          <div class="comment-actions">
            <div class="file-upload-group">
              <input
                type="file"
                class="file-input"
                accept=".pdf,.docx,.txt,.jpg,.png"
                aria-label="Adjuntar archivo"
              />
              <button class="btn-attach" title="Adjuntar archivo">
                📎 ${i18n.t('comentarios.adjuntar', 'Adjuntar')}
              </button>
            </div>
            <button class="btn-send" aria-label="Enviar comentario">
              ➤ ${i18n.t('comentarios.enviar', 'Enviar')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Adjunta event listeners
   */
  private attachListeners(): void {
    const sendBtn = this.containerElement.querySelector('.btn-send');
    const attachBtn = this.containerElement.querySelector('.btn-attach');

    // Enviar comentario
    sendBtn?.addEventListener('click', () => this.handleSendComment());

    // Enter para enviar (Shift+Enter para nueva línea)
    this.inputElement?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendComment();
      }
    });

    // Adjuntar archivo
    attachBtn?.addEventListener('click', () => {
      this.fileInput?.click();
    });

    // Cuando selecciona archivo
    this.fileInput?.addEventListener('change', () => this.handleFileUpload());

    // Auto-resize textarea
    this.inputElement?.addEventListener(
      'input',
      debounce(() => this.resizeTextarea(), 100)
    );
  }

  /**
   * Envía un comentario
   */
  private async handleSendComment(): Promise<void> {
    const text = this.inputElement?.value.trim();

    if (!text) {
      Toast.warning(i18n.t('comentarios.vacio', 'El comentario no puede estar vacío'));
      return;
    }

    if (text.length > 500) {
      Toast.warning(
        i18n.t('comentarios.muy_largo', 'El comentario no puede exceder 500 caracteres')
      );
      return;
    }

    // Mostrar loading
    const sendBtn = this.containerElement.querySelector('.btn-send') as HTMLButtonElement;
    const originalText = sendBtn.textContent;
    sendBtn.disabled = true;
    sendBtn.textContent = i18n.t('comentarios.enviando', 'Enviando...');

    // Agregar comentario localmente (optimistic update)
    this.tarea.addComment(text);

    // TODO: En producción, hacer PATCH a la API
    // const success = await ApiService.patch(`/tareas/${this.tarea.id}/comments`, { text });

    const success = true; // Simulación

    if (success) {
      Toast.success(i18n.t('comentarios.creado', 'Comentario agregado'));
      this.inputElement!.value = '';
      this.resizeTextarea();
    } else {
      Toast.error(i18n.t('comentarios.error', 'Error al agregar comentario'));
      // Revertir cambio local
      const lastComment = this.tarea.comments[this.tarea.comments.length - 1];
      if (lastComment === text) {
        this.tarea.comments.pop();
      }
    }

    // Restaurar botón
    sendBtn.disabled = false;
    sendBtn.textContent = originalText;
  }

  /**
   * Maneja carga de archivos
   */
  private handleFileUpload(): void {
    const file = this.fileInput?.files?.[0];
    if (!file) return;

    // Crear comentario con información del archivo
    const sizeKB = (file.size / 1024).toFixed(2);
    const fileComment = `📎 ${i18n.t('comentarios.archivo', 'Archivo adjunto')}: ${file.name} (${sizeKB} KB)`;

    this.inputElement!.value = fileComment;
    this.resizeTextarea();

    // En producción: hacer upload del archivo
    // const formData = new FormData();
    // formData.append('file', file);
    // await ApiService.uploadFile(`/tareas/${this.tarea.id}/attachments`, formData);

    Toast.info(
      i18n.t('comentarios.archivo_listo', 'Archivo seleccionado. Envía el comentario')
    );

    // Limpiar input de archivo
    this.fileInput!.value = '';
  }

  /**
   * Renderiza la lista de comentarios
   */
  private renderComments(): void {
    if (this.tarea.comments.length === 0) {
      this.commentsListElement.innerHTML = `
        <p class="no-comments">
          ${i18n.t('comentarios.sin_comentarios', 'Sin comentarios aún')}
        </p>
      `;
      return;
    }

    this.commentsListElement.innerHTML = this.tarea.comments
      .map((comment, index) => this.renderCommentItem(comment, index))
      .join('');
  }

  /**
   * Renderiza un comentario individual
   */
  private renderCommentItem(comment: string, index: number): string {
    const isFile = comment.startsWith('📎');
    const isSystem = comment.startsWith('🔄') || comment.startsWith('✅');

    return `
      <div class="comment-item ${isFile ? 'comment-file' : ''} ${isSystem ? 'comment-system' : ''}">
        <div class="comment-content">${comment}</div>
        <button
          class="btn-delete-comment"
          data-index="${index}"
          title="${i18n.t('comentarios.eliminar', 'Eliminar')}"
          aria-label="Eliminar comentario ${index + 1}"
        >
          ✕
        </button>
      </div>
    `;
  }

  /**
   * Auto-resize textarea según contenido
   */
  private resizeTextarea(): void {
    if (!this.inputElement) return;

    this.inputElement.style.height = 'auto';
    this.inputElement.style.height = Math.min(
      this.inputElement.scrollHeight,
      200
    ) + 'px';
  }
}
