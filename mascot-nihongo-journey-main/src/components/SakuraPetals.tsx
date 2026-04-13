import { useEffect } from 'react';

export const SakuraPetals = () => {
  useEffect(() => {
    const container = document.querySelector('.sakura-container');
    if (!container) return;

    const createPetal = () => {
      const petal = document.createElement('div');
      petal.className = 'sakura-petal';
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.animationDuration = `${8 + Math.random() * 6}s`;
      petal.style.animationDelay = `${Math.random() * 5}s`;
      petal.style.opacity = `${0.3 + Math.random() * 0.4}`;
      container.appendChild(petal);

      setTimeout(() => {
        petal.remove();
      }, 14000);
    };

    // Create initial petals
    for (let i = 0; i < 10; i++) {
      setTimeout(() => createPetal(), i * 800);
    }

    // Create new petals periodically
    const interval = setInterval(createPetal, 2000);

    return () => clearInterval(interval);
  }, []);

  return <div className="sakura-container" />;
};
