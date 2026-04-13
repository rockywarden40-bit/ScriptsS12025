import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SpinnerLoader from "@/components/loaders/SpinnerLoader";
import OrbitLoader from "@/components/loaders/OrbitLoader";
import WaveLoader from "@/components/loaders/WaveLoader";
import PulseLoader from "@/components/loaders/PulseLoader";
import GradientLoader from "@/components/loaders/GradientLoader";
import SkeletonLoader from "@/components/loaders/SkeletonLoader";
import ProgressLoader from "@/components/loaders/ProgressLoader";
import ParticleLoader from "@/components/loaders/ParticleLoader";

const loaders = [
  { id: "spinner", name: "Spinner Glow", component: SpinnerLoader },
  { id: "orbit", name: "Orbit Rings", component: OrbitLoader },
  { id: "wave", name: "Wave Dots", component: WaveLoader },
  { id: "pulse", name: "Pulse Circle", component: PulseLoader },
  { id: "gradient", name: "Gradient Flow", component: GradientLoader },
  { id: "skeleton", name: "Skeleton Shimmer", component: SkeletonLoader },
  { id: "progress", name: "Progress Bar", component: ProgressLoader },
  { id: "particle", name: "Particle Burst", component: ParticleLoader },
];

export const LoadingShowcase = () => {
  const [activeLoader, setActiveLoader] = useState("spinner");
  const ActiveLoaderComponent = loaders.find(l => l.id === activeLoader)?.component;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
            Loading Screens
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            A collection of modern, eye-catching loading animations for your next project
          </p>
        </div>

        {/* Loader Selection */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {loaders.map((loader) => (
            <Button
              key={loader.id}
              onClick={() => setActiveLoader(loader.id)}
              variant={activeLoader === loader.id ? "default" : "outline"}
              className="transition-all duration-300 hover:scale-105"
            >
              {loader.name}
            </Button>
          ))}
        </div>

        {/* Active Loader Display */}
        <Card className="max-w-4xl mx-auto bg-card/50 backdrop-blur-sm border-primary/20 shadow-elegant animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="p-8 md:p-12">
            <div className="min-h-[400px] flex items-center justify-center">
              {ActiveLoaderComponent && <ActiveLoaderComponent />}
            </div>
          </div>
        </Card>

        {/* Info Section */}
        <div className="mt-12 text-center max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <p className="text-sm text-muted-foreground">
            Each loader is crafted with smooth animations and modern design principles.
            Click on different options above to see various loading styles.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingShowcase;