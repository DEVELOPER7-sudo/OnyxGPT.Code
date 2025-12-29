# Gemini API Integration Guide

## ❌ Common Mistakes & ✅ Correct Solutions

### Mistake 1: Wrong Package Name
```javascript
// ❌ WRONG
import { GoogleGenAI } from "@google/genai";

// ✅ CORRECT
import { GoogleGenerativeAI } from "@google/generative-ai";
```

### Mistake 2: Wrong Constructor
```javascript
// ❌ WRONG
const ai = new GoogleGenAI({});

// ✅ CORRECT
const genAI = new GoogleGenerativeAI(apiKey);
```

### Mistake 3: Missing API Key
```javascript
// ❌ WRONG
const genAI = new GoogleGenerativeAI();

// ✅ CORRECT
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
```

### Mistake 4: Wrong Method Name
```javascript
// ❌ WRONG
const response = await ai.models.generateContent({
  model: "gemini-3-pro-preview",
  contents: "...",
});

// ✅ CORRECT
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
const response = await model.generateContent("...");
```

### Mistake 5: Wrong Model Name
```javascript
// ❌ WRONG
model: "gemini-3-pro-preview"  // Doesn't exist

// ✅ CORRECT
model: "gemini-2.5-pro"       // Latest available
// or
model: "gemini-2.5-flash"     // Faster/cheaper
// or  
model: "gemini-2.0-flash"     // Default
```

---

## ✅ Correct Full Example

### Simple Synchronous Response
```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

async function main() {
  const response = await model.generateContent(
    "Explain how AI works in a few words"
  );
  console.log(response.text());
}

await main();
```

### Streaming Response (What We Use)
```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

async function main() {
  const response = await model.generateContentStream(
    "Explain how AI works in a few words"
  );
  
  for await (const chunk of response.stream) {
    console.log(chunk.text());
  }
}

await main();
```

### With System Prompt
```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

async function main() {
  const chat = model.startChat({
    history: [],
    generationConfig: { maxOutputTokens: 8192 },
  });

  const systemPrompt = "You are a helpful assistant.";
  const userMessage = "Hello! Can you help me?";
  const fullPrompt = systemPrompt + "\n\n" + userMessage;

  const result = await chat.sendMessageStream(fullPrompt);

  for await (const chunk of result.stream) {
    console.log(chunk.text());
  }
}

await main();
```

---

## 🔑 API Keys

### Where to Get
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key

### How to Use

**Option 1: Environment Variable (Server)**
```bash
# .env file
GEMINI_API_KEY=AIza...your_key...
```

```javascript
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
```

**Option 2: Direct (Client/Browser)**
```javascript
const genAI = new GoogleGenerativeAI("AIza...your_key...");
// ⚠️ Not recommended - key exposed in browser
```

**Option 3: Via Backend Proxy**
```javascript
// Browser sends request to your backend
// Backend uses GEMINI_API_KEY from environment
// Backend returns response to browser
```

---

## 📊 Available Models

### Latest & Recommended
```
gemini-2.5-pro       ← Best quality, most capable
gemini-2.5-flash     ← Faster, still great quality
gemini-2.0-flash     ← Default, good balance
```

### Not Available
```
❌ gemini-3-pro-preview    (Doesn't exist)
❌ gemini-pro              (Discontinued)
❌ gemini-ultra            (Discontinued)
```

---

## 🚀 Quick Test

### Test Your Setup
```bash
# Create a test file: test-gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

async function test() {
  try {
    const response = await model.generateContent("Say hello!");
    console.log("✅ Success:", response.text());
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

await test();
```

```bash
# Run it
GEMINI_API_KEY=your_key_here bun test-gemini.js
```

---

## 🔧 Streaming vs Non-Streaming

### Non-Streaming (Wait for Complete Response)
```javascript
const response = await model.generateContent("...");
console.log(response.text());  // All at once
```

**Pros:**
- Simpler code
- Complete response at once

**Cons:**
- Wait for full response
- Slower user experience

### Streaming (Get Response in Chunks)
```javascript
const response = await model.generateContentStream("...");
for await (const chunk of response.stream) {
  console.log(chunk.text());  // Chunk by chunk
}
```

**Pros:**
- Real-time feedback
- Better user experience
- Can start processing earlier

**Cons:**
- More complex code
- Handle chunks individually

**What We Use:** Streaming (sendMessageStream)

---

## 💡 Common Issues & Solutions

### Issue: "API key not found"
```javascript
// ❌ WRONG
const genAI = new GoogleGenerativeAI();

// ✅ CORRECT - Check environment variable
console.log(process.env.GEMINI_API_KEY);  // Should not be undefined
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
```

### Issue: "Model not found: gemini-3-pro-preview"
```javascript
// ❌ WRONG
model: "gemini-3-pro-preview"

// ✅ CORRECT
model: "gemini-2.5-pro"  // Use existing model
```

### Issue: "Cannot read property 'text' of undefined"
```javascript
// ❌ WRONG
const response = await model.generateContent("...");
console.log(response.text);  // Missing parentheses

// ✅ CORRECT
const response = await model.generateContent("...");
console.log(response.text());  // Call as function
```

### Issue: "Stream is not iterable"
```javascript
// ❌ WRONG
const response = await model.generateContent("...");
for await (const chunk of response) { ... }

// ✅ CORRECT
const response = await model.generateContentStream("...");
for await (const chunk of response.stream) { ... }
```

### Issue: "Rate limit exceeded"
```javascript
// Your API key has hit rate limit
// Solution 1: Wait a bit and retry
// Solution 2: Use fewer/shorter requests
// Solution 3: Check usage at Google AI Studio
// Solution 4: Upgrade to paid plan if needed
```

---

## 📦 Installation

```bash
# Install the package
npm install @google/generative-ai

# Verify installation
npm ls @google/generative-ai
```

**Already installed in OnyxGPT:** Yes ✅

---

## 🔐 Security Best Practices

### ✅ DO
- Store API key in .env file
- Never commit .env to GitHub
- Use different keys for dev/prod
- Rotate keys regularly
- Monitor usage on Google AI Studio

### ❌ DON'T
- Expose API key in browser
- Put API key in frontend code
- Share API keys in chat/email
- Use same key for multiple apps
- Leave API key in code comments

---

## 📚 Official Resources

- **Docs:** https://ai.google.dev
- **SDK GitHub:** https://github.com/google/generative-ai-js
- **API Reference:** https://ai.google.dev/api/rest
- **Pricing:** https://ai.google.dev/pricing

---

## Troubleshooting Checklist

- [ ] API key is valid (get from https://aistudio.google.com/app/apikey)
- [ ] API key is in .env file (or environment variable)
- [ ] Package installed: `npm ls @google/generative-ai`
- [ ] Correct import: `from "@google/generative-ai"`
- [ ] Correct class: `GoogleGenerativeAI`
- [ ] Model name is correct: `gemini-2.5-pro` (not `gemini-3-pro-preview`)
- [ ] Using correct method: `sendMessageStream()` for streaming
- [ ] API key not exposed in browser/frontend
- [ ] No rate limit errors in console
- [ ] Internet connection working

---

## Quick Reference

```javascript
// 1. Import
import { GoogleGenerativeAI } from "@google/generative-ai";

// 2. Initialize
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 3. Get model
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-pro" 
});

// 4. Create chat
const chat = model.startChat({
  history: [],
  generationConfig: { maxOutputTokens: 8192 },
});

// 5. Send message with stream
const result = await chat.sendMessageStream(prompt);

// 6. Iterate chunks
for await (const chunk of result.stream) {
  console.log(chunk.text());
}
```

---

## In OnyxGPT Code

### Our Implementation (✅ CORRECT)
**File:** `server/gemini.ts`

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export async function generateResponse(
  prompt: string, 
  controller: ReadableStreamDefaultController
) {
  const chat = model.startChat({
    history: [],
    generationConfig: { maxOutputTokens: 8192 },
  });

  const fullPrompt = systemPrompt + "\n\n" + prompt;
  const result = await chat.sendMessageStream(fullPrompt);

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    const data = `data: ${JSON.stringify({ text: chunkText })}\n\n`;
    enqueue(encoder.encode(data));
  }

  enqueue(encoder.encode(`data: [DONE]\n\n`));
}
```

This is the correct pattern. Use this as reference!

---

**Last Updated:** January 2025  
**Status:** ✅ Current with latest Gemini API
