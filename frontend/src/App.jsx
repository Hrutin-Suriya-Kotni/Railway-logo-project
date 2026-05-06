import { useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DemoPage from "./pages/DemoPage";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const location = useLocation();

  return (
    <div className="site-wrapper">
      <ScrollToTop />
      <header className="site-header">
        <div className="site-header__container">
          <Link to="/" className="header__brand">
            <h1>AAHANA</h1>
            <span className="header__tagline">DIGITAL TRANSFORMATION & AI</span>
          </Link>
          <nav className="site-nav">
            <ul>
              <li>
                <Link to="/" className={location.pathname === "/" ? "active" : ""}>Home</Link>
              </li>
              <li>
                <Link to="/demo" className={location.pathname === "/demo" ? "active" : ""}>Try Demo</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<DemoPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="footer-container">
          <p>© 2026 Ahana Systems and Solutions Pvt. Ltd. All Rights Reserved.</p>
          <p className="footer-meta">Digital Transformation, Automation, and Advanced AI Solutions.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
