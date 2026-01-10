import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SandboxTerminal } from '@/components/SandboxTerminal';

interface TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export const TerminalModal = ({ isOpen, onClose, projectId }: TerminalModalProps) => {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-5xl sm:h-[85vh] sm:-translate-x-1/2 sm:-translate-y-1/2 bg-background border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50 flex-shrink-0">
              <h2 className="text-lg font-semibold text-foreground">Terminal</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Terminal Content */}
            <div className="flex-1 overflow-hidden bg-black/90">
              <SandboxTerminal
                projectId={projectId}
                onClose={onClose}
                autoStart={true}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
