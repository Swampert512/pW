// TaskController.ts - Controlador MVC del frontend
// Patrón Factory Method para crear widgets del dashboard

interface TaskModel {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Factory Method para widgets
abstract class DashboardWidget {
  abstract render(): HTMLElement;
}

class TaskListWidget extends DashboardWidget {
  private tasks: TaskModel[];

  constructor(tasks: TaskModel[]) {
    super();
    this.tasks = tasks;
  }

  render(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'widget';
    
    const title = document.createElement('h2');
    title.textContent = 'Lista de Tareas';
    container.appendChild(title);

    const list = document.createElement('ul');
    list.id = 'taskList';

    this.tasks.forEach(task => {
      const item = document.createElement('li');
      const titleSpan = document.createElement('span');
      titleSpan.className = `task-title ${task.completed ? 'task-completed' : ''}`;
      titleSpan.textContent = task.title;

      const actions = document.createElement('div');
      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = task.completed ? '🔄' : '✅';
      toggleBtn.className = 'btn-small';
      toggleBtn.onclick = () => this.handleToggle(task.id);

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️';
      deleteBtn.className = 'btn-small';
      deleteBtn.onclick = () => this.handleDelete(task.id);

      actions.appendChild(toggleBtn);
      actions.appendChild(deleteBtn);
      item.appendChild(titleSpan);
      item.appendChild(actions);
      list.appendChild(item);
    });

    container.appendChild(list);
    return container;
  }

  async handleToggle(id: string) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
      });
      if (response.ok) {
        await loadTasks();
      }
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
    }
  }

  async handleDelete(id: string) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadTasks();
      }
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
    }
  }
}

// Funciones auxiliares
async function loadTasks(): Promise<void> {
  try {
    const response = await fetch('/api/tasks');
    const tasks: TaskModel[] = await response.json();
    
    // Actualizar estadísticas
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    document.getElementById('totalTasks')!.textContent = String(total);
    document.getElementById('pendingTasks')!.textContent = String(pending);
    document.getElementById('completedTasks')!.textContent = String(completed);

    // Usar Factory Method para renderizar widgets
    const listWidget = new TaskListWidget(tasks);
    const container = document.getElementById('taskListWidget')!;
    container.innerHTML = '';
    container.appendChild(listWidget.render());

  } catch (error) {
    console.error('Error al cargar tareas:', error);
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadTasks();

  // Modal nueva tarea
  const btnNueva = document.getElementById('btnNuevaTarea')!;
  const modal = document.getElementById('modalTask')!;
  const closeModal = document.getElementById('closeModal')!;
  const form = document.getElementById('formTask') as HTMLFormElement;

  btnNueva.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });

  closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = (document.getElementById('taskTitle') as HTMLInputElement).value;
    const description = (document.getElementById('taskDescription') as HTMLTextAreaElement).value;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });

      if (response.ok) {
        modal.classList.add('hidden');
        form.reset();
        await loadTasks();
      }
    } catch (error) {
      console.error('Error al crear tarea:', error);
    }
  });

  // Selector de idioma
  const selectIdioma = document.getElementById('selectIdioma') as HTMLSelectElement;
  selectIdioma.addEventListener('change', async (e) => {
    const lang = (e.target as HTMLSelectElement).value;
    try {
      const response = await fetch(`/api/i18n/${lang}`);
      const translations = await response.json();
      // Aquí se aplicaría la traducción dinámica
      console.log('Idioma cambiado a:', lang, translations);
    } catch (error) {
      console.error('Error al cambiar idioma:', error);
    }
  });

  // Recargar tareas cada 30 segundos
  setInterval(loadTasks, 30000);
});