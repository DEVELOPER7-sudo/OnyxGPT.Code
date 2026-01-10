import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export const AnimatedBackground = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 1,
          duration: Math.random() * 20 + 10,
          delay: Math.random() * 5,
        });
      }
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient mesh */}
      <motion.div
        className="absolute inset-0 opacity-60"
        animate={{
          background: [
            "radial-gradient(ellipse 80% 50% at 20% 30%, hsl(185 100% 50% / 0.15), transparent 50%), radial-gradient(ellipse 60% 40% at 80% 70%, hsl(270 70% 55% / 0.1), transparent 50%)",
            "radial-gradient(ellipse 80% 50% at 80% 30%, hsl(185 100% 50% / 0.15), transparent 50%), radial-gradient(ellipse 60% 40% at 20% 70%, hsl(270 70% 55% / 0.1), transparent 50%)",
            "radial-gradient(ellipse 80% 50% at 50% 50%, hsl(185 100% 50% / 0.15), transparent 50%), radial-gradient(ellipse 60% 40% at 50% 20%, hsl(270 70% 55% / 0.1), transparent 50%)",
            "radial-gradient(ellipse 80% 50% at 20% 30%, hsl(185 100% 50% / 0.15), transparent 50%), radial-gradient(ellipse 60% 40% at 80% 70%, hsl(270 70% 55% / 0.1), transparent 50%)",
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [-20, -60, -20],
            x: [-10, 10, -10],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Glowing orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(185 100% 50% / 0.08) 0%, transparent 70%)",
          left: "-10%",
          top: "-20%",
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(270 70% 55% / 0.06) 0%, transparent 70%)",
          right: "-5%",
          bottom: "-10%",
        }}
        animate={{
          x: [0, -80, 0],
          y: [0, -60, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
