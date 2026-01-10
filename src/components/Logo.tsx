import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo = ({ size = "md", showText = true }: LogoProps) => {
  const sizes = {
    sm: { icon: 24, text: "text-lg" },
    md: { icon: 32, text: "text-xl" },
    lg: { icon: 48, text: "text-3xl" },
  };

  const { icon, text } = sizes[size];

  return (
    <motion.div 
      className="flex items-center gap-3"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Logo icon */}
      <div className="relative">
        <motion.div
          className="relative flex items-center justify-center"
          style={{ width: icon, height: icon }}
        >
          {/* Outer glow */}
          <div 
            className="absolute inset-0 rounded-lg bg-primary/20 blur-md"
            style={{ transform: "scale(1.2)" }}
          />
          
          {/* Main icon shape */}
          <svg
            width={icon}
            height={icon}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10"
          >
            {/* Hexagonal base */}
            <motion.path
              d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
              fill="url(#logoGradient)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            />
            
            {/* Inner triangle */}
            <motion.path
              d="M16 8L23 20H9L16 8Z"
              fill="hsl(var(--background))"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            />
            
            {/* Center dot */}
            <motion.circle
              cx="16"
              cy="16"
              r="2"
              fill="hsl(var(--primary))"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.8 }}
            />

            <defs>
              <linearGradient id="logoGradient" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="hsl(var(--primary))" />
                <stop offset="1" stopColor="hsl(var(--purple-accent))" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>

      {/* Logo text */}
      {showText && (
        <motion.div 
          className={`font-semibold ${text} tracking-tight`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-foreground">Onyx</span>
          <span className="gradient-text">GPT</span>
          <span className="text-muted-foreground font-normal">.Code</span>
        </motion.div>
      )}
    </motion.div>
  );
};
