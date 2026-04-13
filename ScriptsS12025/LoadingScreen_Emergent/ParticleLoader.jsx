import { useState, useEffect } from "react";

export const ParticleLoader = () => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        angle: (i * 360) / 12,
        delay: i * 0.1,
        size: Math.random() * 8 + 4
      }));
      setParticles(newParticles);
    };
    
    generateParticles();
  }, []);
  
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-40 h-40">
        {/* Center core */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full shadow-glow animate-scale-pulse" />
        
        {/* Particles */}
        {particles.map((particle) => {
          const radius = 60;
          const x = Math.cos((particle.angle * Math.PI) / 180) * radius;
          const y = Math.sin((particle.angle * Math.PI) / 180) * radius;
          
          return (
            <div
              key={particle.id}
              className="absolute top-1/2 left-1/2 rounded-full animate-pulse-glow"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                background: particle.id % 2 === 0 
                  ? 'hsl(var(--primary))' 
                  : 'hsl(var(--accent))',
                animationDelay: `${particle.delay}s`,
                boxShadow: particle.id % 2 === 0 
                  ? '0 0 15px hsl(var(--primary))' 
                  : '0 0 15px hsl(var(--accent))'
              }}
            />
          );
        })}
        
        {/* Rotating rings */}
        <div className="absolute inset-0 border border-primary/30 rounded-full animate-spin" style={{ animationDuration: "3s" }} />
        <div className="absolute inset-4 border border-accent/30 rounded-full animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }} />
      </div>
      
      <div className="text-center">
        <p className="text-foreground font-semibold mb-1">Generating...</p>
        <p className="text-sm text-muted-foreground">Creating your experience</p>
      </div>
    </div>
  );
};

export default ParticleLoader;