export const OrbitLoader = () => {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-32 h-32">
        {/* Center orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-primary rounded-full shadow-glow" />
        
        {/* Orbiting particles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full animate-orbit" />
        </div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full" style={{ animationDelay: "0.5s" }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-full animate-orbit" style={{ animationDelay: "0.5s" }} />
        </div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full" style={{ animationDelay: "1s" }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary/60 rounded-full animate-orbit" style={{ animationDelay: "1s" }} />
        </div>
        
        {/* Ring trails */}
        <div className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-full animate-spin" style={{ animationDuration: "4s" }} />
        <div className="absolute inset-4 border-2 border-dashed border-accent/20 rounded-full animate-spin" style={{ animationDuration: "3s", animationDirection: "reverse" }} />
      </div>
      
      <div className="text-center">
        <p className="text-foreground font-semibold mb-1">Synchronizing...</p>
        <p className="text-sm text-muted-foreground">Connecting to servers</p>
      </div>
    </div>
  );
};

export default OrbitLoader;