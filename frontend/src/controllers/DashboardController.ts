/**
 * DashboardController - Gestiona el dashboard con estadísticas
 *
 * Responsabilidades:
 * 1. Cargar estadísticas del proyecto
 * 2. Crear widgets usando WidgetFactory
 * 3. Renderizar gráficos (pie chart, barras, etc.)
 * 4. Actualizar en tiempo real
 *
 * Performance: <300ms para renderizar widgets
 */

import { ProyectoModel, WidgetFactory, IDashboardStats } from '../models';
import { Toast } from '../utils/Toast';
import { i18n } from '../utils/i18n';

export class DashboardController {
  private proyecto: ProyectoModel;
  private containerElement: HTMLElement;
  private statsContainer: HTMLElement;
  private chartsContainer: HTMLElement;
  private startTime: number = 0;

  constructor(proyecto: ProyectoModel, containerElement: HTMLElement) {
    this.proyecto = proyecto;
    this.containerElement = containerElement;

    this.createLayout();
    this.statsContainer = this.containerElement.querySelector('.stats') as HTMLElement;
    this.chartsContainer = this.containerElement.querySelector('.charts') as HTMLElement;

    // Re-renderizar cuando proyecto cambia
    this.proyecto.onChange(() => this.loadStats());

    // Carga inicial
    this.loadStats();
  }

  /**
   * Crea la estructura del dashboard
   */
  private createLayout(): void {
    this.containerElement.innerHTML = `
      <div class="dashboard">
        <div class="dashboard-header">
          <h2>📊 Dashboard</h2>
          <button class="btn-refresh" aria-label="Actualizar">
            🔄 Actualizar
          </button>
        </div>
        <div class="stats"></div>
        <div class="charts"></div>
      </div>
    `;

    // Botón de actualizar
    this.containerElement.querySelector('.btn-refresh')?.addEventListener('click', () => {
      this.loadStats();
    });
  }

  /**
   * Carga estadísticas del proyecto
   */
  private async loadStats(): Promise<void> {
    this.startTime = performance.now();

    const stats = this.proyecto.getStats;
    if (!stats) {
      this.statsContainer.innerHTML = '<p class="loading">Cargando...</p>';
      return;
    }

    this.renderStats(stats);
    this.renderCharts(stats);

    const elapsed = performance.now() - this.startTime;
    console.log(`⏱️ Dashboard renderizado en ${elapsed.toFixed(2)}ms`);

    if (elapsed > 300) {
      console.warn(`⚠️ Dashboard tardó ${elapsed.toFixed(2)}ms (target: <300ms)`);
    }
  }

  /**
   * Renderiza las estadísticas numéricas
   */
  private renderStats(stats: IDashboardStats): void {
    const percentComplete = stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

    this.statsContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-number">${stats.totalTasks}</div>
          <div class="stat-label">${i18n.t('dashboard.total_tareas', 'Total de Tareas')}</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${stats.completedTasks}</div>
          <div class="stat-label">${i18n.t('dashboard.completadas', 'Completadas')}</div>
        </div>
        <div class="stat-box">
          <div class="stat-number" style="color: #61DAFB;">${percentComplete}%</div>
          <div class="stat-label">${i18n.t('dashboard.progreso', 'Progreso')}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentComplete}%;"></div>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-number" style="color: #EF4444;">${stats.overdueCount}</div>
          <div class="stat-label">${i18n.t('dashboard.vencidas', 'Vencidas')}</div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza los gráficos usando WidgetFactory
   */
  private renderCharts(stats: IDashboardStats): void {
    this.chartsContainer.innerHTML = '';

    // Crear widgets
    const widgets = [
      {
        title: i18n.t('dashboard.por_estado', 'Tareas por Estado'),
        element: WidgetFactory.create('pieChart', stats)
      },
      {
        title: i18n.t('dashboard.vencidas', 'Tareas Vencidas'),
        element: WidgetFactory.create('overdueList', stats.overdueTasks)
      },
      {
        title: i18n.t('dashboard.carga_usuario', 'Carga por Usuario'),
        element: WidgetFactory.create('userLoad', stats)
      },
      {
        title: i18n.t('dashboard.prioridades', 'Distribución de Prioridades'),
        element: WidgetFactory.create('priorityBar', stats)
      }
    ];

    // Insertar widgets en contenedor
    const grid = document.createElement('div');
    grid.className = 'charts-grid';

    widgets.forEach(widget => {
      const wrapper = document.createElement('div');
      wrapper.className = 'widget-wrapper';

      const header = document.createElement('div');
      header.className = 'widget-header';
      header.innerHTML = `<h3>${widget.title}</h3>`;

      wrapper.appendChild(header);
      wrapper.appendChild(widget.element);
      grid.appendChild(wrapper);
    });

    this.chartsContainer.appendChild(grid);
  }

  /**
   * Dibuja gráfico de pastel con Canvas (alternativa a SVG)
   */
  private drawPieChart(canvas: HTMLCanvasElement, stats: IDashboardStats): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const total = stats.totalTasks || 1;
    const todo = (stats.tasksByState['TODO'] || 0) / total;
    const inProgress = (stats.tasksByState['IN_PROGRESS'] || 0) / total;
    const testing = (stats.tasksByState['TESTING'] || 0) / total;
    const done = (stats.tasksByState['DONE'] || 0) / total;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    const colors = ['#EF4444', '#3B82F6', '#F97316', '#22C55E'];
    const slices = [todo, inProgress, testing, done];

    let currentAngle = -Math.PI / 2;

    slices.forEach((slice, index) => {
      if (slice === 0) return;

      const sliceAngle = slice * 2 * Math.PI;

      // Dibujar slice
      ctx.fillStyle = colors[index];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        currentAngle,
        currentAngle + sliceAngle
      );
      ctx.closePath();
      ctx.fill();

      // Dibujar borde
      ctx.strokeStyle = '#282A36';
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });
  }
}
