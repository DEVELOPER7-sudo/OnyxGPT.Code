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
import { Settings, Key, Eye, EyeOff, Check, X } from "lucide-react";
import { useApiKey } from "@/hooks/useApiKey";

export function ApiKeyInput() {
  const { apiKey, setApiKey, clearApiKey, hasApiKey } = useApiKey();
  const [inputValue, setInputValue] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    setApiKey(inputValue.trim());
    setOpen(false);
  };

  const handleClear = () => {
    clearApiKey();
    setInputValue('');
  };

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
            Enter your own Gemini API key. Get one free at{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
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
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!inputValue.trim()} className="flex-1">
              Save Key
            </Button>
            {hasApiKey && (
              <Button variant="destructive" onClick={handleClear}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
