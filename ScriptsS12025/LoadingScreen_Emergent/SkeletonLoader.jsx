export const SkeletonLoader = () => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-md">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-muted rounded-full animate-shimmer" 
             style={{
               background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground) / 0.2) 50%, hsl(var(--muted)) 75%)',
               backgroundSize: '200% 100%'
             }} />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-muted rounded animate-shimmer" 
               style={{
                 background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground) / 0.2) 50%, hsl(var(--muted)) 75%)',
                 backgroundSize: '200% 100%',
                 width: '70%'
               }} />
          <div className="h-3 bg-muted rounded animate-shimmer" 
               style={{
                 background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground) / 0.2) 50%, hsl(var(--muted)) 75%)',
                 backgroundSize: '200% 100%',
                 width: '50%',
                 animationDelay: '0.1s'
               }} />
        </div>
      </div>
      
      {/* Content skeletons */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-shimmer"
               style={{
                 background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground) / 0.2) 50%, hsl(var(--muted)) 75%)',
                 backgroundSize: '200% 100%',
                 animationDelay: `${i * 0.1}s`
               }} />
        ))}
      </div>
      
      <div className="text-center mt-4">
        <p className="text-foreground font-semibold mb-1">Loading content...</p>
        <p className="text-sm text-muted-foreground">Just a moment</p>
      </div>
    </div>
  );
};

export default SkeletonLoader;