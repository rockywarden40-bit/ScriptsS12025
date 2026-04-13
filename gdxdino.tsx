import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, Volume2, VolumeX, Play, RotateCcw } from "lucide-react";

type SkinColor = "cyan" | "pink" | "lime";

const SKINS = {
  cyan: { color: "hsl(190, 100%, 50%)", glow: "glow-cyan" },
  pink: { color: "hsl(330, 100%, 55%)", glow: "glow-pink" },
  lime: { color: "hsl(75, 100%, 50%)", glow: "glow-lime" },
};

interface Obstacle {
  x: number;
  width: number;
  height: number;
}

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [selectedSkin, setSelectedSkin] = useState<SkinColor>("cyan");
  
  const gameRef = useRef({
    player: { x: 100, y: 300, width: 30, height: 30, velocityY: 0, jumping: false },
    obstacles: [] as Obstacle[],
    groundY: 350,
    gravity: 0.6,
    jumpForce: -12,
    gameSpeed: 5,
    obstacleTimer: 0,
    spawnInterval: 90,
    distance: 0,
  });

  const animationFrameRef = useRef<number>();

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("geometryDashHighScore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("geometryDashHighScore", score.toString());
    }
  }, [score, highScore]);

  const resetGame = useCallback(() => {
    const game = gameRef.current;
    game.player = { x: 100, y: 300, width: 30, height: 30, velocityY: 0, jumping: false };
    game.obstacles = [];
    game.obstacleTimer = 0;
    game.distance = 0;
    game.gameSpeed = 5;
    setScore(0);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setGameState("playing");
  }, [resetGame]);

  const jump = useCallback(() => {
    if (gameState === "playing") {
      const game = gameRef.current;
      if (!game.player.jumping) {
        game.player.velocityY = game.jumpForce;
        game.player.jumping = true;
      }
    }
  }, [gameState]);

  const checkCollision = useCallback((player: typeof gameRef.current.player, obstacle: Obstacle) => {
    return (
      player.x < obstacle.x + obstacle.width &&
      player.x + player.width > obstacle.x &&
      player.y < gameRef.current.groundY &&
      player.y + player.height > gameRef.current.groundY - obstacle.height
    );
  }, []);

  const gameLoop = useCallback(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const game = gameRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ground line
    ctx.strokeStyle = SKINS[selectedSkin].color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, game.groundY);
    ctx.lineTo(canvas.width, game.groundY);
    ctx.stroke();

    // Update player physics
    game.player.velocityY += game.gravity;
    game.player.y += game.player.velocityY;

    if (game.player.y >= game.groundY - game.player.height) {
      game.player.y = game.groundY - game.player.height;
      game.player.velocityY = 0;
      game.player.jumping = false;
    }

    // Draw player with glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = SKINS[selectedSkin].color;
    ctx.fillStyle = SKINS[selectedSkin].color;
    ctx.fillRect(game.player.x, game.player.y, game.player.width, game.player.height);
    ctx.shadowBlur = 0;

    // Spawn obstacles
    game.obstacleTimer++;
    if (game.obstacleTimer > game.spawnInterval) {
      game.obstacles.push({
        x: canvas.width,
        width: 30,
        height: 40 + Math.random() * 40,
      });
      game.obstacleTimer = 0;
      game.spawnInterval = 60 + Math.random() * 40; // Randomize spawn rate
    }

    // Update and draw obstacles
    game.obstacles = game.obstacles.filter((obstacle) => {
      obstacle.x -= game.gameSpeed;

      // Draw obstacle with red glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = "hsl(0, 100%, 60%)";
      ctx.fillStyle = "hsl(0, 100%, 60%)";
      ctx.fillRect(
        obstacle.x,
        game.groundY - obstacle.height,
        obstacle.width,
        obstacle.height
      );
      ctx.shadowBlur = 0;

      // Check collision
      if (checkCollision(game.player, obstacle)) {
        setGameState("gameover");
        return false;
      }

      return obstacle.x + obstacle.width > 0;
    });

    // Update score and speed
    game.distance += game.gameSpeed;
    const newScore = Math.floor(game.distance / 10);
    setScore(newScore);

    // Gradually increase difficulty
    if (newScore % 50 === 0 && newScore > 0) {
      game.gameSpeed = Math.min(game.gameSpeed + 0.1, 12);
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, selectedSkin, checkCollision]);

  useEffect(() => {
    if (gameState === "playing") {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, gameLoop]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (gameState === "idle" || gameState === "gameover") {
          startGame();
        } else {
          jump();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState, jump, startGame]);

  // Touch/click controls
  const handleCanvasClick = () => {
    if (gameState === "idle" || gameState === "gameover") {
      startGame();
    } else {
      jump();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-animated overflow-hidden relative">
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/30"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animation: `float ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + "s",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold text-primary text-glow mb-2 tracking-wider">
            GEOMETRY RUNNER
          </h1>
          <p className="text-muted-foreground text-lg tracking-widest">
            TAP SPACE OR CLICK TO JUMP
          </p>
        </div>

        {/* Score Display */}
        <div className="flex gap-6 mb-4 text-center">
          <div className="bg-card/50 backdrop-blur-sm px-6 py-3 rounded-sm border border-primary/30">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Score
            </div>
            <div className="text-3xl font-bold text-primary text-glow">{score}</div>
          </div>
          <div className="bg-card/50 backdrop-blur-sm px-6 py-3 rounded-sm border border-secondary/30">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              High Score
            </div>
            <div className="text-3xl font-bold text-secondary text-glow">{highScore}</div>
          </div>
        </div>

        {/* Game Canvas */}
        <Card className="relative bg-card/30 backdrop-blur-sm border-primary/30 p-6 mb-6 hover:border-primary/50 transition-colors">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            onClick={handleCanvasClick}
            className="cursor-pointer rounded-sm max-w-full h-auto"
          />

          {/* Game State Overlays */}
          {gameState === "idle" && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-sm">
              <div className="text-center space-y-4">
                <Play className="w-16 h-16 mx-auto text-primary animate-pulse" />
                <p className="text-2xl font-bold text-primary text-glow">
                  Click or Press SPACE to Start
                </p>
              </div>
            </div>
          )}

          {gameState === "gameover" && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-sm">
              <div className="text-center space-y-6 animate-scale-in">
                <h2 className="text-5xl font-bold text-secondary text-glow">
                  TRY AGAIN
                </h2>
                <p className="text-xl text-muted-foreground">
                  You survived {score} points!
                </p>
                <Button
                  onClick={startGame}
                  size="lg"
                  className="bg-primary hover:bg-primary/80 text-primary-foreground glow-cyan font-bold uppercase tracking-wider"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Restart
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            size="lg"
            className="border-primary/50 hover:border-primary text-primary hover:bg-primary/10 font-bold uppercase tracking-wider"
          >
            <Settings className="w-5 h-5 mr-2" />
            Settings
          </Button>

          <Button
            onClick={() => setMusicEnabled(!musicEnabled)}
            variant="outline"
            size="lg"
            className="border-secondary/50 hover:border-secondary text-secondary hover:bg-secondary/10 font-bold uppercase tracking-wider"
          >
            {musicEnabled ? (
              <Volume2 className="w-5 h-5 mr-2" />
            ) : (
              <VolumeX className="w-5 h-5 mr-2" />
            )}
            Music {musicEnabled ? "On" : "Off"}
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mt-6 bg-card/50 backdrop-blur-sm border-primary/30 p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-bold text-primary mb-4 uppercase tracking-wider">
              Choose Your Skin
            </h3>
            <div className="flex gap-4 justify-center">
              {(Object.keys(SKINS) as SkinColor[]).map((skin) => (
                <button
                  key={skin}
                  onClick={() => setSelectedSkin(skin)}
                  className={`w-16 h-16 rounded-sm border-2 transition-all ${
                    selectedSkin === skin
                      ? `border-${skin} ${SKINS[skin].glow} scale-110`
                      : "border-muted hover:scale-105"
                  }`}
                  style={{
                    backgroundColor: SKINS[skin].color,
                    boxShadow:
                      selectedSkin === skin
                        ? `0 0 20px ${SKINS[skin].color}, 0 0 40px ${SKINS[skin].color}`
                        : "none",
                  }}
                  aria-label={`${skin} skin`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4 uppercase tracking-wider">
              Selected: {selectedSkin}
            </p>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground uppercase tracking-widest">
          <p>Built with ♦ for the arcade generation</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
