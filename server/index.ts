
import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { generateResponse } from './puter';
import {
  getProjects,
  createProject,
  deleteProject,
  updateFile,
  deleteFile,
  renameFile
} from './db';

console.log("Starting server...");

const app = new Elysia()
  .use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))
  .get('/', () => 'OnyxGPT.Code Server is running')

  .post('/api/generate', async ({ body }) => {
    console.log("Generate API called");
    const { prompt, modelId = 'gpt-4o', sandboxApi = 'https://api.puter.com/ai/text/generate' } = body;

    const stream = new ReadableStream({
      start(controller) {
        generateResponse(prompt, modelId, sandboxApi, controller);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }, {
    body: t.Object({ 
      prompt: t.String(),
      modelId: t.Optional(t.String()),
      sandboxApi: t.Optional(t.String())
    })
  })

  .get('/api/projects', async () => {
    try {
      const projects = await getProjects();
      return { success: true, projects };
    } catch (error) {
      console.error('Error reading projects:', error);
      return { success: true, projects: [] };
    }
  })

  .post('/api/create-project', async ({ body }) => {
    const { projectName } = body;
    try {
      const project = await createProject(projectName);
      return { success: true, message: 'Project created successfully.', project };
    } catch (error) {
      console.error(`Error during project setup:`, error);
      return new Response(JSON.stringify({ success: false, message: (error as Error).message }), { status: 500 });
    }
  }, {
    body: t.Object({ projectName: t.String() })
  })

  .delete('/api/delete-project/:projectId', async ({ params }) => {
    const { projectId } = params;
    try {
      await deleteProject(projectId);
      return { success: true, message: `Project ${projectId} deleted.` };
    } catch (error) {
      console.error(`Error deleting project:`, error);
      return new Response(JSON.stringify({ success: false, message: (error as Error).message }), { status: 500 });
    }
  }, {
    params: t.Object({ projectId: t.String() })
  })

  .post('/api/update-file', async ({ body }) => {
    const { projectId, operation } = body;
    try {
      switch (operation.type) {
        case 'write':
          if (!operation.path || typeof operation.content !== 'string') throw new Error("Write op missing path/content.");
          await updateFile(projectId, operation.path, operation.content);
          break;
        case 'delete':
          if (!operation.path) throw new Error("Delete op missing path.");
          await deleteFile(projectId, operation.path);
          break;
        case 'rename':
          if (!operation.oldPath || !operation.newPath) throw new Error("Rename op missing paths.");
          await renameFile(projectId, operation.oldPath, operation.newPath);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation.type}`);
      }
      return { success: true };
    } catch (error) {
      console.error(`[${projectId}] Error performing file op:`, error);
      return new Response(JSON.stringify({ success: false, message: (error as Error).message }), { status: 500 });
    }
  }, {
    body: t.Object({
      projectId: t.String(),
      operation: t.Object({
        type: t.String(),
        path: t.Optional(t.String()),
        content: t.Optional(t.String()),
        oldPath: t.Optional(t.String()),
        newPath: t.Optional(t.String()),
      })
    })
  })

  .listen(3002);

console.log(`🦊 OnyxGPT.Code server is running at ${app.server?.hostname}:${app.server?.port}`);
