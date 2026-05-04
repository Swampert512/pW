/**
 * Factory Pattern - Crea widgets reutilizables para el dashboard
 *
 * Ventajas del Factory:
 * 1. Centraliza creación de widgets complejos
 * 2. Permite reutilizar widgets en múltiples vistas
 * 3. Fácil agregar nuevos tipos de widgets
 * 4. Lógica de renderizado separada del resto
 *
 * Uso:
 *   const pieChart = WidgetFactory.create('pieChart', stats);
 *   container.appendChild(pieChart);
 */

import { IDashboardStats, ITarea, TaskState } from './types';

export type WidgetType = 'pieChart' | 'overdueList' | 'taskStats' | 'userLoad' | 'priorityBar';

export class WidgetFactory {
  /**
   * Factory method principal - crea widgets por tipo
   */
  static create(type: WidgetType, data: any): HTMLElement {
    switch (type) {
      case 'pieChart':
        return this.createPieChart(data as IDashboardStats);
      case 'overdueList':
        return this.createOverdueList(data as ITarea[]);
      case 'taskStats':
        return this.createTaskStats(data as IDashboardStats);
      case 'userLoad':
        return this.createUserLoad(data as IDashboardStats);
      case 'priorityBar':
        return this.createPriorityBar(data as IDashboardStats);
      default:
        return this.createEmpty();
    }
  }

  /**
   * Widget: Gráfico de pastel (tareas por estado)
   */
  private static createPieChart(stats: IDashboardStats): HTMLElement {
    const container = document.createElement('div');
    container.className = 'widget pie-chart';

    // Calcular porcentajes
    const total = stats.totalTasks || 1;
    const todo = stats.tasksByState['TODO'] || 0;
    const inProgress = stats.tasksByState['IN_PROGRESS'] || 0;
    const testing = stats.tasksByState['TESTING'] || 0;
    const done = stats.tasksByState['DONE'] || 0;

    const todoPct = (todo / total) * 100;
    const inProgressPct = (inProgress / total) * 100;
    const testingPct = (testing / total) * 100;
    const donePct = (done / total) * 100;

    // Crear SVG simple
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('width', '200');
    svg.setAttribute('height', '200');

    let offset = 0;

    // Segmento TODO (rojo)
    this.addPieSegment(svg, offset, todoPct, '#ef4444', 'TODO');
    offset += todoPct;

    // Segmento IN_PROGRESS (azul)
    this.addPieSegment(svg, offset, inProgressPct, '#3b82f6', 'IN_PROGRESS');
    offset += inProgressPct;

    // Segmento TESTING (naranja)
    this.addPieSegment(svg, offset, testingPct, '#f97316', 'TESTING');
    offset += testingPct;

    // Segmento DONE (verde)
    this.addPieSegment(svg, offset, donePct, '#22c55e', 'DONE');

    // Leyenda
    const legend = document.createElement('div');
    legend.className = 'legend';
    legend.innerHTML = `
      <div class="legend-item"><span class="dot" style="background: #ef4444;"></span> TODO (${todo})</div>
      <div class="legend-item"><span class="dot" style="background: #3b82f6;"></span> En Progreso (${inProgress})</div>
      <div class="legend-item"><span class="dot" style="background: #f97316;"></span> Testing (${testing})</div>
      <div class="legend-item"><span class="dot" style="background: #22c55e;"></span> Completadas (${done})</div>
    `;

    container.appendChild(svg);
    container.appendChild(legend);
    return container;
  }

  /**
   * Agregador: añade segmento al gráfico de pastel
   */
  private static addPieSegment(
    svg: SVGSVGElement,
    offset: number,
    percentage: number,
    color: string,
    label: string
  ): void {
    if (percentage === 0) return;

    const startAngle = (offset / 100) * 360;
    const endAngle = ((offset + percentage) / 100) * 360;

    const radius = 40;
    const centerX = 50;
    const centerY = 50;

    // Convertir ángulos a radianes
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    // Puntos de inicio y fin
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    // Flag para arco grande (si > 180°)
    const largeArc = percentage > 50 ? 1 : 0;

    // Crear path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    path.setAttribute('d', d);
    path.setAttribute('fill', color);
    path.setAttribute('stroke', '#fff');
    path.setAttribute('stroke-width', '1');

    svg.appendChild(path);
  }

  /**
   * Widget: Lista de tareas vencidas (overdue)
   */
  private static createOverdueList(tareas: ITarea[]): HTMLElement {
    const container = document.createElement('div');
    container.className = 'widget overdue-list';

    const title = document.createElement('h3');
    title.textContent = `⚠️ Tareas Vencidas (${tareas.length})`;
    container.appendChild(title);

    if (tareas.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No hay tareas vencidas';
      container.appendChild(empty);
      return container;
    }

    const list = document.createElement('ul');
    tareas.forEach(tarea => {
      const item = document.createElement('li');
      const daysOverdue = Math.floor(
        (Date.now() - new Date(tarea.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      item.innerHTML = `
        <div class="overdue-item">
          <strong>${tarea.title}</strong>
          <span class="days-overdue">Hace ${daysOverdue} días</span>
          <span class="priority priority-${tarea.priority.toLowerCase()}">${tarea.priority}</span>
        </div>
      `;
      list.appendChild(item);
    });

    container.appendChild(list);
    return container;
  }

  /**
   * Widget: Estadísticas de tareas (números grandes)
   */
  private static createTaskStats(stats: IDashboardStats): HTMLElement {
    const container = document.createElement('div');
    container.className = 'widget task-stats';

    const percentComplete = stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

    container.innerHTML = `
      <div class="stat-box">
        <div class="stat-number">${stats.totalTasks}</div>
        <div class="stat-label">Total de Tareas</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${stats.completedTasks}</div>
        <div class="stat-label">Completadas</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${percentComplete}%</div>
        <div class="stat-label">Progreso</div>
      </div>
      <div class="stat-box">
        <div class="stat-number" style="color: #ef4444;">${stats.overdueCount}</div>
        <div class="stat-label">Vencidas</div>
      </div>
    `;

    return container;
  }

  /**
   * Widget: Carga de trabajo por usuario
   */
  private static createUserLoad(stats: IDashboardStats): HTMLElement {
    const container = document.createElement('div');
    container.className = 'widget user-load';

    const title = document.createElement('h3');
    title.textContent = '👥 Carga por Usuario';
    container.appendChild(title);

    const users = Object.values(stats.loadByUser);

    if (users.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No hay asignaciones';
      container.appendChild(empty);
      return container;
    }

    users.forEach(user => {
      const bar = document.createElement('div');
      bar.className = 'load-bar';

      const maxTasks = Math.max(...users.map(u => u.taskCount), 1);
      const percentage = (user.taskCount / maxTasks) * 100;

      bar.innerHTML = `
        <div class="user-name">${user.userName}</div>
        <div class="progress-bar" style="width: 100%;">
          <div class="progress-fill" style="width: ${percentage}%; background: #3b82f6;"></div>
        </div>
        <div class="task-count">${user.taskCount} tareas</div>
      `;

      container.appendChild(bar);
    });

    return container;
  }

  /**
   * Widget: Barra de prioridades
   */
  private static createPriorityBar(stats: IDashboardStats): HTMLElement {
    const container = document.createElement('div');
    container.className = 'widget priority-bar';

    const title = document.createElement('h3');
    title.textContent = '🎯 Distribución por Prioridad';
    container.appendChild(title);

    // Calcular prioridades desde overdue tasks
    const prioridades = { ALTA: 0, MEDIA: 0, BAJA: 0 };
    stats.overdueTasks.forEach(t => {
      if (t.priority === 'ALTA') prioridades.ALTA++;
      if (t.priority === 'MEDIA') prioridades.MEDIA++;
      if (t.priority === 'BAJA') prioridades.BAJA++;
    });

    const total = Object.values(prioridades).reduce((a, b) => a + b, 0) || 1;

    const bars = [
      { label: 'ALTA', value: prioridades.ALTA, color: '#ef4444' },
      { label: 'MEDIA', value: prioridades.MEDIA, color: '#f97316' },
      { label: 'BAJA', value: prioridades.BAJA, color: '#22c55e' }
    ];

    bars.forEach(bar => {
      const percentage = (bar.value / total) * 100;
      const item = document.createElement('div');
      item.className = 'priority-item';
      item.innerHTML = `
        <div class="priority-label">${bar.label}</div>
        <div class="priority-bar-bg">
          <div class="priority-bar-fill" style="width: ${percentage}%; background: ${bar.color};"></div>
        </div>
        <div class="priority-count">${bar.value}</div>
      `;
      container.appendChild(item);
    });

    return container;
  }

  /**
   * Widget vacío (fallback)
   */
  private static createEmpty(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'widget empty';
    container.textContent = 'Widget desconocido';
    return container;
  }
}
