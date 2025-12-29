import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export async function generateResponse(
  prompt: string, 
  controller: ReadableStreamDefaultController
) {
  const encoder = new TextEncoder();
  const enqueue = controller.enqueue.bind(controller);
  const close = controller.close.bind(controller);
  
  try {
    console.log("Loading system prompt...");
    const systemPrompt = await getSystemPrompt();
    console.log("System prompt loaded, length:", systemPrompt.length);
    
    console.log("Creating chat session...");
    const chat = model.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 8192 },
    });

    console.log("Sending user prompt to Gemini API...");
    const fullPrompt = systemPrompt + "\n\n" + prompt;
    const result = await chat.sendMessageStream(fullPrompt);
    
    console.log("Streaming response chunks...");
    let chunkCount = 0;
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        chunkCount++;
        console.log(`Chunk ${chunkCount}: ${chunkText.length} characters`);
        const data = `data: ${JSON.stringify({ text: chunkText })}\n\n`;
        enqueue(encoder.encode(data));
      }
    }

    console.log(`Stream complete. Total chunks: ${chunkCount}`);
    enqueue(encoder.encode(`data: [DONE]\n\n`));

  } catch (error) {
    console.error("Gemini error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error details:", errorMessage);
    enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
  } finally {
    close();
  }
}

async function getSystemPrompt(): Promise<string> {
  const promptPath = path.join(process.cwd(), 'system-prompt.md');
  try {
    return await fs.readFile(promptPath, 'utf-8');
  } catch (error) {
    console.error("Error reading system prompt:", error);
    return "You are an expert full-stack software engineer.";
  }
}
