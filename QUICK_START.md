# OnyxGPT.Code - Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Clone & Install
```bash
git clone https://github.com/aniketdandagavhan/OnyxGPT.Code.git
cd OnyxGPT.Code/OpenLovable
bun install
```

### 2. Start Development
```bash
bun run dev
```

This starts both:
- **Frontend** at http://localhost:8080
- **Backend** at http://localhost:3002

### 3. Create Your First Project
1. Open http://localhost:8080 in your browser
2. Describe your app: "A beautiful weather dashboard"
3. Click the send button
4. Watch AI build your app in real-time

---

## ⚙️ Configuration (Optional)

### Default Settings
- **Model:** `gpt-4o`
- **API:** Puter AI (free, no key needed)

### Custom Configuration
1. Click the **⚙️ Settings** icon (top-right)
2. Enter your **Model ID** (e.g., `gpt-4-turbo`)
3. Enter your **API Endpoint** (e.g., `https://api.openai.com/v1/chat/completions`)
4. Click **Save Settings**

#### Supported Endpoints
- **Puter AI:** `https://api.puter.com/ai/text/generate` (default)
- **OpenAI:** `https://api.openai.com/v1/chat/completions`
- **Local LLM:** Any OpenAI-compatible endpoint (e.g., Ollama, vLLM)
- **Custom API:** Must be OpenAI-compatible with streaming support

---

## 🎯 What You Can Build

OnyxGPT.Code excels at:
- 📱 **Web Apps:** Todo lists, dashboards, calculators
- 🎨 **UI Components:** Landing pages, portfolios
- 📊 **Data Visualizations:** Charts, graphs, tables
- 🛍️ **E-commerce:** Product catalogs, shopping carts
- 🔐 **Forms & Authentication:** Login pages, signup flows

---

## 💡 Pro Tips

### Better Prompts
```
❌ "Make a todo app"
✓ "Create a React todo app with dark mode, drag-and-drop, and localStorage"
```

### Iterative Development
1. Start with a simple version: "A basic todo app"
2. See it live in the preview
3. Create a new project for variations

### Debugging
- **Code Tab:** View all generated files
- **Preview Tab:** See live rendering
- **Browser DevTools:** Debug like normal React app

---

## 🐛 Troubleshooting

### "API Error" / "Stream Error"
**Solution:**
1. Check Settings (⚙️ icon)
2. Verify model ID is not empty
3. Verify API endpoint is correct
4. Default Puter API should work without any setup

### Preview not showing
**Solution:**
1. Check browser console for errors
2. Ensure JavaScript is enabled
3. Try a simpler prompt first

### Settings not saving
**Solution:**
1. Check if localStorage is enabled
2. Clear browser cache
3. Try incognito/private mode

### Build fails
**Solution:**
```bash
# Clear and reinstall
rm -rf node_modules bun.lockb
bun install

# Rebuild
bun run build
```

---

## 📚 Resources

- **README.md** - Full project documentation
- **MIGRATION_GUIDE.md** - Detailed setup and customization
- **CHANGES.md** - What's new compared to Open Lovable

---

## 🚀 Next Steps

1. ✅ Create your first project
2. 🎨 Customize with Settings
3. 🔄 Try iterative improvements
4. 📤 Export and deploy your project
5. 🤝 Contribute improvements back

---

## 🆘 Need Help?

- Check the docs above
- Look at existing projects for examples
- Open an issue on GitHub

---

**Happy Building! 🎉**

OnyxGPT.Code - Build with AI, no keys required.
