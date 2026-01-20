import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Config from "./pages/Config";
import Generating from "./pages/Generating";
import Editor from "./pages/Editor";
import Analysis from "./pages/Analysis";
import { AnimatePresence } from "framer-motion";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/config" element={<Config />} />
        <Route path="/generating" element={<Generating />} />
        <Route path="/editor" element={<Editor />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen text-foreground font-sans antialiased overflow-hidden">
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;
