import { GoogleGenerativeAI } from '@google/generative-ai';

export interface StreamChunk {
  text: string;
}

export class GeminiStreamClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async *generateStream(prompt: string): AsyncGenerator<StreamChunk> {
    const client = new GoogleGenerativeAI(this.apiKey);
    const generativeModel = client.getGenerativeModel({ model: this.model });

    const stream = await generativeModel.generateContentStream(prompt);

    for await (const chunk of stream.stream) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        yield { text };
      }
    }
  }
}
