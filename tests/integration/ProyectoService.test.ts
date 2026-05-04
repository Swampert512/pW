import { ProyectoService } from '../../../backend/src/application/services/ProyectoService';
import { ProyectoRepositoryImpl } from '../../../backend/src/infrastructure/adapters/ProyectoRepositoryImpl';
import { Proyecto } from '../../../backend/src/domain/entities/Proyecto';
import { Usuario } from '../../../backend/src/domain/entities/Usuario';
import { UserRole } from '../../../shared/types/enums';
import { createDatabase } from '../../../backend/src/infrastructure/adapters/SQLiteDatabase';

/**
 * Tests de integración para ProyectoService.
 * Requiere una BD SQLite real (se crea en memoria o archivo de prueba).
 */
describe('ProyectoService (integración)', () => {
  let service: ProyectoService;
  let repository: ProyectoRepositoryImpl;

  beforeAll(async () => {
    // Crear BD de prueba
    await createDatabase();
    repository = new ProyectoRepositoryImpl();
    service = new ProyectoService(repository);
  });

  describe('Crear y listar proyectos', () => {
    it('debería crear un proyecto', async () => {
      const proyecto = await service.createProject({
        name: 'Proyecto Test',
        description: 'Descripción de prueba'
      });

      expect(proyecto).toBeInstanceOf(Proyecto);
      expect(proyecto.id).toBeDefined();
      expect(proyecto.name).toBe('Proyecto Test');
    });

    it('debería listar proyectos activos', async () => {
      const proyectos = await service.listActiveProjects();

      expect(Array.isArray(proyectos)).toBe(true);
      expect(proyectos.length).toBeGreaterThan(0);
    });

    it('debería obtener un proyecto por ID', async () => {
      const created = await service.createProject({
        name: 'Proyecto Get',
        description: 'Para obtener'
      });

      const found = await service.getProjectById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe('Proyecto Get');
    });
  });

  describe('Gestión de miembros', () => {
    it('debería agregar un miembro al proyecto', async () => {
      const proyecto = await service.createProject({
        name: 'Proyecto Con Miembros',
        description: 'Test'
      });

      const usuario = new Usuario('u1', 'Ana', 'ana@test.com', UserRole.MIEMBRO);
      const actualizado = await service.addMember(proyecto.id, usuario);

      expect(actualizado.team.length).toBe(1);
      expect(actualizado.team[0].id).toBe('u1');
    });
  });

  describe('Archivado', () => {
    it('debería archivar un proyecto', async () => {
      const proyecto = await service.createProject({
        name: 'Proyecto Archivable',
        description: 'Test'
      });

      const archivado = await service.archiveProject(proyecto.id);

      expect(archivado.archived).toBe(true);
    });
  });
});