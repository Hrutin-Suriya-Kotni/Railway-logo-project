import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="landing-page">
      <section className="hero">
        <div className="hero__content">
          <h1 className="hero__title">CHITRA AI</h1>
          <h2 className="hero__subtitle">Vision Intelligence for the Modern Rail</h2>
          
          <div className="hero__elaborate-copy">
            <p>
              <strong>CHITRA</strong> (Computerized High-speed Image & Technical-drawing Recognition Architecture) 
              is an enterprise-grade vision platform engineered specifically for the precision demands 
              of the railway industry. 
            </p>
            <p>
              By leveraging specialized neural networks, CHITRA automates the identification of critical 
              infrastructure components within complex technical diagrams and high-resolution site documentation. 
              Our technology transforms hours of manual cross-referencing into seconds of automated, 
              high-fidelity precision.
            </p>
          </div>

          <div className="hero__actions">
            <Link to="/samples" className="btn btn--large btn--glass">
              Explore Sample Data
            </Link>
            <Link to="/demo" className="btn btn--large btn--primary">
              Launch Live Demo
            </Link>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">🎯</div>
          <h3>High Precision</h3>
          <p>Meticulously trained YOLO models for 99%+ detection accuracy on railway symbology.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Instant Analysis</h3>
          <p>Convert days of manual diagram auditing into seconds of real-time AI insight.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📄</div>
          <h3>Format Agnostic</h3>
          <p>Seamlessly process architectural PDFs, high-res JPEGs, and technical SIP charts.</p>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
