import { Routes, Route, Link, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SamplesPage from "./pages/SamplesPage";
import DemoPage from "./pages/DemoPage";

function App() {
  const location = useLocation();

  return (
    <div className="site-wrapper">
      <header className="site-header">
        <div className="site-header__container">
          <Link to="/" className="header__brand">
            <h1>CHITRA</h1>
            <span className="header__tagline">AI VISION ARCHITECTURE</span>
          </Link>
          <nav className="site-nav">
            <ul>
              <li>
                <Link to="/" className={location.pathname === "/" ? "active" : ""}>Home</Link>
              </li>
              <li>
                <Link to="/samples" className={location.pathname === "/samples" ? "active" : ""}>Samples</Link>
              </li>
              <li>
                <Link to="/demo" className={location.pathname === "/demo" ? "active" : ""}>Live Demo</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/samples" element={<SamplesPage />} />
          <Route path="/demo" element={<DemoPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="footer-container">
          <p>© 2026 CHITRA Intelligence Platform. All Rights Reserved.</p>
          <p className="footer-meta">Proprietary Neural Network for Railway Infrastructure Identification.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
