import { CreateTaskUseCase } from '../../backend/src/application/usecases/CreateTaskUseCase';
import { CrearTareaCommand } from '../../backend/src/domain/commands/CrearTareaCommand';
import { Tarea } from '../../backend/src/domain/entities/Tarea';
import { Usuario } from '../../backend/src/domain/entities/Usuario';
import { Priority, UserRole } from '../../shared/types/enums';

// Mock del repositorio (implementando ITareaRepository)
const mockRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  findByState: jest.fn(),
  findByResponsible: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

describe('CreateTaskUseCase', () => {
  let useCase: CreateTaskUseCase;
  const futureDate = new Date(Date.now() + 86400000); // Mañana

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateTaskUseCase(mockRepository);
  });

  it('should create a task with valid data', async () => {
    const command = new CrearTareaCommand(
      'Test task',
      'Description test',
      'proj-1',
      futureDate,
      Priority.ALTA
    );

    // Simular que el comando ejecuta y construye la tarea
    const createdTask = command.execute();
    mockRepository.save.mockResolvedValue(createdTask);

    const result = await useCase.execute(command);

    expect(result).toBeInstanceOf(Tarea);
    expect(result.title).toBe('Test task');
    expect(result.description).toBe('Description test');
    expect(result.state).toBe('TODO');
    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test task',
        projectId: 'proj-1'
      })
    );
  });

  it('should throw error when title is empty', async () => {
    const command = new CrearTareaCommand(
      '',
      'Description',
      'proj-1',
      futureDate
    );

    await expect(useCase.execute(command)).rejects.toThrow('El título de la tarea es requerido');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw error when projectId is empty', async () => {
    const command = new CrearTareaCommand(
      'Task',
      'Desc',
      '',
      futureDate
    );

    await expect(useCase.execute(command)).rejects.toThrow('La tarea debe pertenecer a un proyecto');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw error when dueDate is in the past', async () => {
    const pastDate = new Date(Date.now() - 86400000);

    const command = new CrearTareaCommand(
      'Task',
      'Desc',
      'proj-1',
      pastDate
    );

    await expect(useCase.execute(command)).rejects.toThrow('La fecha de vencimiento debe ser futura');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should assign a responsible user when provided', async () => {
    const responsable = new Usuario('user-1', 'Juan Pérez', 'juan@email.com', UserRole.MIEMBRO);

    const command = new CrearTareaCommand(
      'Task with owner',
      'Desc',
      'proj-1',
      futureDate,
      Priority.MEDIA,
      responsable
    );

    const createdTask = command.execute();
    mockRepository.save.mockResolvedValue(createdTask);

    const result = await useCase.execute(command);

    expect(result.responsible).toBeDefined();
    expect(result.responsible!.id).toBe('user-1');
    expect(result.responsible!.name).toBe('Juan Pérez');
  });
});