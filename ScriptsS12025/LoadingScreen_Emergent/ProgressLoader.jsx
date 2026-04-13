import { useState, useEffect } from "react";

export const ProgressLoader = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 1;
      });
    }, 30);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      {/* Progress bar container */}
      <div className="w-full space-y-4">
        <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
          {/* Progress fill */}
          <div 
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-150"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))'
            }}
          >
            {/* Shimmer effect */}
            <div 
              className="absolute inset-0 animate-shimmer opacity-50"
              style={{
                background: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.4) 50%, transparent 75%)',
                backgroundSize: '200% 100%'
              }}
            />
          </div>
        </div>
        
        {/* Percentage display */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Loading assets...</span>
          <span className="text-lg font-bold text-foreground">{progress}%</span>
        </div>
      </div>
      
      {/* Loading steps */}
      <div className="w-full space-y-2">
        {[
          { label: 'Initializing', threshold: 25 },
          { label: 'Loading resources', threshold: 50 },
          { label: 'Preparing interface', threshold: 75 },
          { label: 'Finalizing', threshold: 100 }
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              progress >= step.threshold 
                ? 'bg-primary shadow-glow scale-110' 
                : 'bg-muted'
            }`} />
            <span className={`text-sm transition-colors duration-300 ${
              progress >= step.threshold 
                ? 'text-foreground font-medium' 
                : 'text-muted-foreground'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressLoader;