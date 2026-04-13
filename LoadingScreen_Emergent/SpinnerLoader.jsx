export const SpinnerLoader = () => {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full blur-xl opacity-50" 
             style={{ 
               background: 'conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))' 
             }} />
        
        {/* Spinning ring */}
        <div className="relative w-24 h-24 rounded-full border-4 border-muted animate-spin">
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary" />
        </div>
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full animate-pulse-glow" />
      </div>
      
      <div className="text-center">
        <p className="text-foreground font-semibold mb-1">Loading...</p>
        <p className="text-sm text-muted-foreground">Please wait a moment</p>
      </div>
    </div>
  );
};

export default SpinnerLoader;