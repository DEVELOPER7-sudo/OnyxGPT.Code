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
  
  try {
    console.log("Loading system prompt...");
    const systemPrompt = await getSystemPrompt();
    
    console.log("Starting chat with system prompt...");
    const chat = model.startChat({
      history: [{ role: "user", parts: [{ text: systemPrompt }] }],
      generationConfig: { maxOutputTokens: 8192 },
    });

    console.log("Sending user prompt...");
    const result = await chat.sendMessageStream(prompt);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      const data = `data: ${JSON.stringify({ text: chunkText })}\n\n`;
      controller.enqueue(encoder.encode(data));
    }

    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));

  } catch (error) {
    console.error("Gemini error:", error);
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`));
  } finally {
    controller.close();
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
