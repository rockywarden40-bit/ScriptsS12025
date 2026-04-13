import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ParticlesBackground } from "./components/ParticlesBackground";
import { SakuraPetals } from "./components/SakuraPetals";
import { MusicPlayer } from "./components/MusicPlayer";
import Welcome from "./pages/Welcome";
import Home from "./pages/Home";
import Hanko from "./pages/Hanko";
import Hiragana from "./pages/Hiragana";
import Katakana from "./pages/Katakana";
import Kanji from "./pages/Kanji";
import Quiz from "./pages/Quiz";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ParticlesBackground />
      <SakuraPetals />
      <MusicPlayer />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/" element={<Home />} />
          <Route path="/hanko" element={<Hanko />} />
          <Route path="/hiragana" element={<Hiragana />} />
          <Route path="/katakana" element={<Katakana />} />
          <Route path="/kanji" element={<Kanji />} />
          <Route path="/quiz" element={<Quiz />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
