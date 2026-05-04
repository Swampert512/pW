/**
 * Servidor Express - Punto de entrada de la aplicación.
 * Integra:
 * - Adaptadores de repositorio (SQLite)
 * - Servicios de aplicación
 * - Middlewares (auth, CORS, body-parser)
 * - Rutas RESTful protegidas
 * - Swagger docs
 * - i18n
 */
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

// Importar adaptadores
import { createDatabase } from './adapters/SQLiteDatabase';
import { ProyectoRepositoryImpl } from './adapters/ProyectoRepositoryImpl';
import { TareaRepositoryImpl } from './adapters/TareaRepositoryImpl';

// Importar servicios de aplicación
import { ProyectoService } from '../application/services/ProyectoService';
import { TareaService } from '../application/services/TareaService';

// Importar rutas
import { proyectoRoutes } from './routes/proyectoRoutes';
import { tareaRoutes } from './routes/tareaRoutes';
import { comentariosRoutes } from './routes/comentariosRoutes';
import { usuariosRoutes } from './routes/usuariosRoutes';

// Importar middlewares
import { corsMiddleware } from './middlewares/corsMiddleware';

// Importar i18n
import { i18n } from './i18n/i18nManager';

const PORT = process.env.PORT || 3000;

/**
 * Configuración de Swagger
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Gestión de Tareas API',
      version: '1.0.0',
      description: 'API RESTful para gestión de proyectos y tareas'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      { name: 'Proyectos', description: 'Operaciones con proyectos' },
      { name: 'Tareas', description: 'Operaciones con tareas' }
    ]
  },
  apis: [path.join(__dirname, './routes/*.ts')]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Inicializar aplicación
 */
async function initApp() {
  const app = express();

  // --- Middlewares globales ---
  app.use(corsMiddleware);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Servir archivos estáticos del frontend
  app.use(express.static(path.join(__dirname, '../../frontend/src/views')));
  app.use('/assets', express.static(path.join(__dirname, '../../frontend/src/assets')));

  // --- Inicializar base de datos ---
  console.log('Inicializando base de datos...');
  await createDatabase();
  console.log('Base de datos lista.');

  // --- Inyección de dependencias ---
  const proyectoRepo = new ProyectoRepositoryImpl();
  const tareaRepo = new TareaRepositoryImpl();

  const proyectoService = new ProyectoService(proyectoRepo);
  const tareaService = new TareaService(tareaRepo, proyectoRepo);

  // --- Health check ---
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- Swagger docs ---
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        persistAuthorization: true
      }
    })
  );

  // --- i18n endpoint ---
  app.get('/api/i18n/:lang', (req, res) => {
    const lang = req.params.lang as 'es' | 'en';
    if (!['es', 'en'].includes(lang)) {
      return res.status(400).json({ error: 'Idioma no soportado' });
    }
    res.json({ lang, translations: i18n.getAll(lang) });
  });

  // --- Rutas de API ---
  app.use('/api/proyectos', proyectoRoutes(proyectoService));
  app.use('/api/tareas', tareaRoutes(tareaService));
  app.use('/api/tareas', comentariosRoutes(tareaService));
  app.use('/api/usuarios', usuariosRoutes());

  // --- Error handling ---
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Error interno del servidor',
      timestamp: new Date().toISOString()
    });
  });

  // --- Iniciar servidor ---
  app.listen(PORT, () => {
    console.log(`\n✅ Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📚 Documentación Swagger en http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health check en http://localhost:${PORT}/health`);
    console.log(`🌐 Traducción en http://localhost:${PORT}/api/i18n/es\n`);
  });

  return app;
}

// Ejecutar
initApp().catch((error) => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});

export default initApp;