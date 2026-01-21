import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Config from "./pages/Config";
import Generating from "./pages/Generating";
import Editor from "./pages/Editor";
import Analysis from "./pages/Analysis";
import RepoInit from "./pages/RepoInit";
import Docs from "./pages/Docs";
import Layout from "./components/Layout";
import { AnimatePresence } from "framer-motion";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/:owner/:repo" element={<RepoInit />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/config" element={<Config />} />
        <Route path="/generating" element={<Generating />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/docs" element={<Docs />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </Router>
  );
}

export default App;
