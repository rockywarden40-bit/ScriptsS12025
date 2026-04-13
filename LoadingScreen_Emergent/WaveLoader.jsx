export const WaveLoader = () => {
  const dots = [0, 1, 2, 3, 4];
  
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-end gap-3 h-24">
        {dots.map((i) => (
          <div
            key={i}
            className="w-4 h-4 bg-primary rounded-full animate-wave"
            style={{ 
              animationDelay: `${i * 0.1}s`,
              boxShadow: '0 0 20px hsl(var(--primary))'
            }}
          />
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-foreground font-semibold mb-1">Processing...</p>
        <p className="text-sm text-muted-foreground">Almost there</p>
      </div>
    </div>
  );
};

export default WaveLoader;