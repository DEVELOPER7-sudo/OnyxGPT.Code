import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Key, Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";
import { useApiKey } from "@/hooks/useApiKey";
import { toast } from "sonner";

export function ApiKeyInput() {
  const { apiKey, setApiKey, clearApiKey, hasApiKey } = useApiKey();
  const [inputValue, setInputValue] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    const trimmedKey = inputValue.trim();
    if (!trimmedKey) {
      toast.error('Empty Key', {
        description: 'Please enter a valid API key.',
      });
      return;
    }
    setApiKey(trimmedKey);
    toast.success('API Key Saved', {
      description: 'Your Gemini API key has been saved securely in your browser.',
    });
    setOpen(false);
  };

  const handleClear = () => {
    clearApiKey();
    setInputValue('');
    toast.info('API Key Cleared', {
      description: 'Your API key has been removed.',
    });
  };
  
  const isValidKey = inputValue.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Key className="w-4 h-4" />
          {hasApiKey ? (
            <span className="flex items-center gap-1">
              API Key Set <Check className="w-3 h-3 text-green-500" />
            </span>
          ) : (
            "Set API Key"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Gemini API Key
          </DialogTitle>
          <DialogDescription>
            Enter your Gemini API key. Get one free at{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              Google AI Studio
            </a>
            . Your key is stored locally in your browser.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showKey ? "text" : "password"}
                placeholder="AIza..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="pr-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isValidKey) {
                    handleSave();
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 flex gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-blue-700 dark:text-blue-300">
              Your API key is stored <strong>only in your browser</strong> using localStorage. It is never sent to our servers.
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={!isValidKey} 
              className="flex-1"
            >
              Save Key
            </Button>
            {hasApiKey && (
              <Button 
                variant="destructive" 
                size="icon"
                onClick={handleClear}
                title="Clear saved API key"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
