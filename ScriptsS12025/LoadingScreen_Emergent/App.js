import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoadingShowcase from "@/components/LoadingShowcase";

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoadingShowcase />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;