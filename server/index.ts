import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { generateResponse } from './gemini';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY not found in environment variables");
  process.exit(1);
}

console.log("Starting server...");

const app = new Elysia()
  .use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))
  .get('/', () => 'Open Lovable Server is running')
  
  .post('/api/generate', async ({ body }) => { 
    console.log("Generate API called with prompt:", body.prompt?.substring(0, 100) + "...");
    
    try {
      const { prompt } = body;
      
      const stream = new ReadableStream({
        start(controller) {
          generateResponse(prompt, controller);
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (error) {
      console.error("Error in generate endpoint:", error);
      return new Response(JSON.stringify({ error: (error as Error).message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }, {
    body: t.Object({ prompt: t.String() })
  })

  .post('/api/create-project', async ({ body }) => {
    const { projectId } = body;
    const projectPath = path.join(process.cwd(), 'projects', projectId);
    const templatePath = path.join(process.cwd(), 'template');
    try {
      await fs.mkdir(projectPath, { recursive: true });
      await fs.cp(templatePath, projectPath, { recursive: true });
      const proc = Bun.spawn(['bun', 'install'], { cwd: projectPath, stdout: 'pipe', stderr: 'pipe' });
      const installExitCode = await proc.exited;
      if (installExitCode !== 0) {
        const stderr = await new Response(proc.stderr).text();
        throw new Error(`'bun install' failed: ${stderr}`);
      }
      return { success: true, message: 'Project created successfully.' };
    } catch (error) {
      console.error(`[${projectId}] Error during project setup:`, error);
      return new Response(JSON.stringify({ success: false, message: (error as Error).message }), { status: 500 });
    }
  }, {
    body: t.Object({ projectId: t.String(), prompt: t.String() })
  })

  .delete('/api/delete-project/:projectId', async ({ params }) => {
    const { projectId } = params;
    const projectPath = path.join(process.cwd(), 'projects', projectId);
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
      return { success: true, message: `Project ${projectId} deleted.` };
    } catch (error) {
      console.error(`[${projectId}] Error deleting project directory:`, error);
      return new Response(JSON.stringify({ success: false, message: (error as Error).message }), { status: 500 });
    }
  }, {
    params: t.Object({ projectId: t.String() })
  })

  .post('/api/update-file', async ({ body }) => {
    const { projectId, operation } = body;
    const projectsDir = path.resolve(process.cwd(), 'projects');
    const projectPath = path.resolve(projectsDir, projectId);
    const sanitize = (filePath: string) => {
      const safePath = path.resolve(projectPath, filePath);
      if (!safePath.startsWith(projectPath)) throw new Error(`Path traversal attempt: ${filePath}`);
      return safePath;
    };
    try {
      switch (operation.type) {
        case 'write':
          if (!operation.path || typeof operation.content !== 'string') throw new Error("Write op missing path/content.");
          const writePath = sanitize(operation.path);
          await fs.mkdir(path.dirname(writePath), { recursive: true });
          await fs.writeFile(writePath, operation.content);
          break;
        case 'delete':
          if (!operation.path) throw new Error("Delete op missing path.");
          const deletePath = sanitize(operation.path);
          await fs.rm(deletePath, { recursive: true, force: true });
          break;
        case 'rename':
          if (!operation.oldPath || !operation.newPath) throw new Error("Rename op missing paths.");
          const oldPath = sanitize(operation.oldPath);
          const newPath = sanitize(operation.newPath);
          await fs.rename(oldPath, newPath);
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

console.log(`🦊 Open Lovable server is running at ${app.server?.hostname}:${app.server?.port}`);
