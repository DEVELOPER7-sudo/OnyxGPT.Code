import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert frontend React engineer who specializes in building beautiful, functional web applications using React, TypeScript, and Tailwind CSS. 

When generating code:
1. Create complete, functional React components
2. Use modern React patterns (hooks, functional components)
3. Apply Tailwind CSS for styling
4. Include proper TypeScript types
5. Make the UI responsive and accessible

When modifying files, use these special XML tags:
- <lov-write file_path="path/to/file.tsx">content</lov-write> - Create or overwrite a file
- <lov-rename original_file_path="old/path.tsx" new_file_path="new/path.tsx" /> - Rename a file
- <lov-delete file_path="path/to/file.tsx" /> - Delete a file

Always wrap code changes in the appropriate tags. Be creative and build something impressive!`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model = "gemini-2.0-flash", apiKey } = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key is required. Please set your Gemini API key." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiModel = model.startsWith("gemini-") ? model : `gemini-2.0-flash`;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
          { role: "model", parts: [{ text: "Understood. I will generate code using the specified XML tags for file operations." }] },
          { role: "user", parts: [{ text: prompt }] },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      
      if (response.status === 400 && errorText.includes("API_KEY_INVALID")) {
        return new Response(
          JSON.stringify({ error: "Invalid API key. Please check your Gemini API key." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform the SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      return new Response(
        JSON.stringify({ error: "No response body" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6).trim();
                if (jsonStr && jsonStr !== "[DONE]") {
                  try {
                    const parsed = JSON.parse(jsonStr);
                    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                    }
                  } catch {
                    // Ignore parse errors
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Generate function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
