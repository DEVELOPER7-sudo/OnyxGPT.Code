import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateResponse(
  prompt: string, 
  controller: ReadableStreamDefaultController
) {
  const encoder = new TextEncoder();
  
  // --- START OF DEBUGGING FIX ---
  // We add detailed logs to trace the execution flow.
  try {
    console.log("--- [GEMINI SERVICE] Starting generation ---");
    console.log(`[GEMINI SERVICE] Loading system prompt...`);
    const systemPrompt = await getSystemPrompt();
    console.log(`[GEMINI SERVICE] System prompt loaded. Starting chat...`);

    const chat = model.startChat({
      history: [{ role: "user", parts: [{ text: systemPrompt }] }],
      generationConfig: { maxOutputTokens: 8192 },
    });
    console.log(`[GEMINI SERVICE] Chat started. Sending message to Google AI...`);

    const result = await chat.sendMessageStream(prompt);
    console.log(`[GEMINI SERVICE] Received stream from Google AI. Beginning to process chunks...`);

    let chunkCount = 0;
    for await (const chunk of result.stream) {
      chunkCount++;
      const chunkText = chunk.text();
      const data = `data: ${JSON.stringify({ text: chunkText })}\n\n`;
      controller.enqueue(encoder.encode(data));
    }

    console.log(`[GEMINI SERVICE] Finished processing ${chunkCount} chunks.`);
    const doneData = `data: [DONE]\n\n`;
    controller.enqueue(encoder.encode(doneData));

  } catch (error) {
    // This block will now catch any error from the steps above.
    console.error("--- [GEMINI SERVICE] CRITICAL ERROR ---");
    console.error(error); // Log the full error object from the SDK.
    const errorData = `data: ${JSON.stringify({ error: (error as Error).message })}\n\n`;
    controller.enqueue(encoder.encode(errorData));
    console.error("--- [GEMINI SERVICE] Sent error to client ---");

  } finally {
    // This will run whether the try block succeeded or failed.
    console.log("[GEMINI SERVICE] Closing stream controller.");
    controller.close();
  }
  // --- END OF DEBUGGING FIX ---
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
