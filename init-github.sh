#!/bin/bash

# Initialize OnyxGPT.Code repository on GitHub
# Usage: ./init-github.sh

set -e

echo "🔧 OnyxGPT.Code - GitHub Initialization"
echo "========================================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Initialize git repo if not already done
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
    git config user.email "developer@onyxgpt.code"
    git config user.name "OnyxGPT Developer"
else
    echo "✅ Git repository already initialized"
fi

# Add all files
echo "📝 Staging files..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: OnyxGPT.Code - Lovable.dev clone with React 19, Vite, Tailwind CSS v4, CodeMirror, and Puter.js integration" || echo "Commit already exists"

# Show next steps
echo ""
echo "✅ Repository initialized!"
echo ""
echo "📤 Next steps:"
echo "1. Create a new repository on GitHub at https://github.com/new"
echo "2. Name it: OnyxGPT.Code"
echo "3. Run these commands:"
echo ""
echo "   git remote add origin https://github.com/DEVELOPER7-sudo/OnyxGPT.Code.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "💡 You'll need GitHub CLI (gh) or Git credentials configured."
echo ""
