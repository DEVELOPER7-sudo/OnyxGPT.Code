import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogIn, LogOut, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { usePuter } from '@/hooks/usePuter';

export const AuthButton = () => {
  const { user, isAuthenticated, isAuthLoading, isPuterAvailable } = useAppStore();
  const { signIn, signOut } = usePuter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignIn = async () => {
    if (!isPuterAvailable) return;
    setIsLoading(true);
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setIsLoading(false);
      setIsDropdownOpen(false);
    }
  };

  if (isAuthLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  if (!isAuthenticated || user?.username === 'Anonymous') {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleSignIn}
        disabled={isLoading || !isPuterAvailable}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LogIn className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">Sign In</span>
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="gap-2"
      >
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-3 h-3 text-primary" />
        </div>
        <span className="hidden sm:inline max-w-[100px] truncate">{user?.username}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence>
        {isDropdownOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-48 glass-card rounded-xl border border-border/50 shadow-lg z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-border/50">
                <div className="text-sm font-medium truncate">{user?.username}</div>
                {user?.email && (
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                )}
              </div>
              <div className="p-2">
                <button
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
