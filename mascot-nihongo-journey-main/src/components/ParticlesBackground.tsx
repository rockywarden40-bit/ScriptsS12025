import { useEffect, useRef } from 'react';

export const ParticlesBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const particleCount = 30;
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 6}s`;
      particle.style.animationDuration = `${4 + Math.random() * 4}s`;
      
      const colors = ['hsl(350, 85%, 75%)', 'hsl(350, 90%, 85%)', 'hsl(0, 70%, 45%)'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      particle.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
      
      containerRef.current.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach(particle => particle.remove());
    };
  }, []);

  return <div ref={containerRef} className="particles-bg" />;
};
