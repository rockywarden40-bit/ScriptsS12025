export const GradientLoader = () => {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-64 h-2 bg-muted rounded-full overflow-hidden">
        {/* Animated gradient bar */}
        <div 
          className="absolute inset-0 animate-gradient rounded-full"
          style={{
            background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))',
            backgroundSize: '200% 100%'
          }}
        />
        
        {/* Shimmer effect */}
        <div 
          className="absolute inset-0 animate-shimmer rounded-full opacity-50"
          style={{
            background: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.3) 50%, transparent 75%)',
            backgroundSize: '200% 100%'
          }}
        />
      </div>
      
      <div className="text-center">
        <p className="text-foreground font-semibold mb-1">Loading...</p>
        <p className="text-sm text-muted-foreground">Preparing your content</p>
      </div>
    </div>
  );
};

export default GradientLoader;