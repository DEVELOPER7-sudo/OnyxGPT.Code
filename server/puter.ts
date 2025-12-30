import fs from "fs/promises";
import path from "path";

export async function generateResponse(
  prompt: string,
  modelId: string = "gpt-4o",
  sandboxApi: string = "https://api.puter.com/ai/text/generate",
  controller: ReadableStreamDefaultController
) {
  const encoder = new TextEncoder();
  const enqueue = controller.enqueue.bind(controller);
  const close = controller.close.bind(controller);

  try {
    console.log("Loading system prompt...");
    const systemPrompt = await getSystemPrompt();

    console.log("Calling Puter AI API...");
    const systemPromptContent =
      `${systemPrompt}\n\nUser prompt: ${prompt}`;

    const response = await fetch(sandboxApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "system",
            content: systemPromptContent,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Puter API error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.substring(6).trim();
          if (dataStr === "[DONE]") {
            continue;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (
              parsed.choices &&
              parsed.choices[0] &&
              parsed.choices[0].delta &&
              parsed.choices[0].delta.content
            ) {
              const text = parsed.choices[0].delta.content;
              const data = `data: ${JSON.stringify({ text })}\n\n`;
              enqueue(encoder.encode(data));
            }
          } catch (e) {
            console.log("Parse error:", e);
          }
        }
      }
    }

    enqueue(encoder.encode(`data: [DONE]\n\n`));
  } catch (error) {
    console.error("Puter API error:", error);
    enqueue(
      encoder.encode(
        `data: ${JSON.stringify({ error: (error as Error).message })}\n\n`
      )
    );
  } finally {
    close();
  }
}

async function getSystemPrompt(): Promise<string> {
  const promptPath = path.join(process.cwd(), "system-prompt.md");
  try {
    return await fs.readFile(promptPath, "utf-8");
  } catch (error) {
    console.error("Error reading system prompt:", error);
    return "You are an expert full-stack software engineer.";
  }
}
