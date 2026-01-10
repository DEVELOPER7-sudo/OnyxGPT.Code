import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PromptInput = () => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    
    // Generate UUID for the new project
    const projectId = uuidv4();
    
    // Simulate a brief loading state for dramatic effect
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Navigate to project with the prompt as state
    navigate(`/project/${projectId}`, { 
      state: { 
        initialPrompt: prompt.trim(),
        createdAt: Date.now() 
      } 
    });
  }, [prompt, isLoading, navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="w-full max-w-3xl mx-auto"
    >
      <motion.div
        className={`relative rounded-2xl transition-all duration-300 ${
          isFocused ? "shadow-glow" : ""
        }`}
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Gradient border effect */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary/50 via-purple-accent/30 to-primary/50 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" 
          style={{ opacity: isFocused ? 1 : 0 }}
        />
        
        <div className="relative glass-card rounded-2xl overflow-hidden">
          {/* Sparkle icon */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
            <motion.div
              animate={isFocused ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="w-5 h-5 text-primary/60" />
            </motion.div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Describe what you want to build..."
            rows={1}
            className="w-full bg-transparent text-foreground text-lg px-14 py-5 resize-none focus:outline-none placeholder:text-muted-foreground/50 min-h-[64px] max-h-[200px]"
            style={{
              height: "auto",
              overflow: "hidden",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
            }}
          />

          {/* Submit button */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isLoading}
              size="icon"
              className="rounded-xl h-10 w-10 bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Helper text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-muted-foreground/60 text-sm mt-4"
      >
        Press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-xs font-mono">Enter</kbd> to start building
      </motion.p>
    </motion.div>
  );
};
