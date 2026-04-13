import { ChessBoard } from '@/components/ChessBoard';

const Index = () => {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Chess
          </h1>
          <p className="text-muted-foreground">Play a classic game of chess</p>
        </div>
        <ChessBoard />
      </div>
    </div>
  );
};

export default Index;
