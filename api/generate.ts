import { GoogleGenerativeAI } from "@google/generative-ai";
import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from "fs/promises";
import path from "path";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY environment variable is not set.");
}

async function getSystemPrompt(): Promise<string> {
  try {
    const promptPath = path.join(process.cwd(), 'system-prompt.md');
    return await fs.readFile(promptPath, 'utf-8');
  } catch (error) {
    console.error("Error reading system prompt:", error);
    return "You are an expert full-stack software engineer. Help users build applications by generating code.";
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const { prompt } = req.body;

  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required in request body' });
    return;
  }

  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    return;
  }

  try {
    // Set streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log("Initializing Gemini API...");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    console.log("Loading system prompt...");
    const systemPrompt = await getSystemPrompt();

    console.log("Creating chat session...");
    const chat = model.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 8192 },
    });

    console.log("Sending prompt to Gemini API...");
    const fullPrompt = systemPrompt + "\n\n" + prompt;
    const result = await chat.sendMessageStream(fullPrompt);

    console.log("Streaming response...");
    let chunkCount = 0;

    // Stream the response
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        chunkCount++;
        console.log(`Chunk ${chunkCount}: ${chunkText.length} characters`);
        const data = `data: ${JSON.stringify({ text: chunkText })}\n\n`;
        res.write(data);
      }
    }

    console.log(`Stream complete. Total chunks: ${chunkCount}`);
    res.write(`data: [DONE]\n\n`);
    res.end();

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error details:", errorMessage);

    // Send error as SSE format
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
    }

    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
}
