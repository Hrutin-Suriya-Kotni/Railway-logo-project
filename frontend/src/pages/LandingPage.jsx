import { useState } from "react";
import { Link } from "react-router-dom";
import PredictionModal from "../components/PredictionModal";

const RESULT_GALLERY = [
  { id: 1, name: "Sathi SIP", thumb: "/results/thumbnails/Sathi_thumb.jpg", url: "/results/Sathi_original.jpg", detectedUrl: "/results/Sathi_detected.jpg" },
  { id: 2, name: "Semra PH-2 SIP", thumb: "/results/thumbnails/Semra_thumb.jpg", url: "/results/Semra_original.jpg", detectedUrl: "/results/Semra_detected.jpg" },
  { id: 3, name: "Signal Aspect Block", thumb: "/results/thumbnails/Signal_thumb.jpg", url: "/results/Signal_original.jpg", detectedUrl: "/results/Signal_detected.jpg" },
  { id: 4, name: "Thalwara Mod RCC", thumb: "/results/thumbnails/Thalwara_RCC_thumb.jpg", url: "/results/Thalwara_RCC_original.jpg", detectedUrl: "/results/Thalwara_RCC_detected.jpg" },
  { id: 5, name: "Thalwara Mod SIP", thumb: "/results/thumbnails/Thalwara_SIP_thumb.jpg", url: "/results/Thalwara_SIP_original.jpg", detectedUrl: "/results/Thalwara_SIP_detected.jpg" },
  { id: 6, name: "Vidyapathidham SIP", thumb: "/results/thumbnails/Vidyapathidham_thumb.jpg", url: "/results/Vidyapathidham_original.jpg", detectedUrl: "/results/Vidyapathidham_detected.jpg" },
];

function LandingPage() {
  const [selectedResult, setSelectedResult] = useState(null);

  return (
    <div className="landing-page">
      <section className="hero">
        <div className="hero__content">
          <h1 className="hero__title">AAHANA</h1>
          <h2 className="hero__subtitle">Digital Transformation & Vision Intelligence</h2>
          
          <div className="hero__elaborate-copy">
            <h3>Ahana Systems and Solutions Pvt. Ltd.</h3>
            <p>
              Ahana Systems and Solutions Pvt. Ltd. is a Bengaluru-based IT services and consulting firm founded in 2007, 
              focused on helping organizations with digital transformation. The company provides solutions in cloud 
              computing, data analytics, automation, application development, and managed IT services.
            </p>
            <p>
              With a strong global presence across India, the US, UK, and Europe, Ahana supports businesses in 
              improving operational efficiency and reducing manual effort.
            </p>
          </div>

          <div className="hero__actions">
            <Link to="/demo" className="btn btn--large btn--primary">
              Try Demo
            </Link>
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="info-section__container">
          <header className="section-header">
            <h2>Capabilities & Innovation</h2>
            <p>Our technology enables organizations to modernize and grow with precision.</p>
          </header>
          <div className="features">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Advanced Computer Vision</h3>
              <p>Utilizing fine-tuned advanced computer vision models for mission-critical infrastructure detection.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Operational Efficiency</h3>
              <p>Dramatically reduce manual effort and improve auditing speed across all technical documentation.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Global Scalability</h3>
              <p>Scalable IT solutions delivered with a customer-centric approach across multiple global markets.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="results-showcase">
        <div className="section-header">
          <h2>RESULTS</h2>
          <p>Inspect high-resolution diagrams already processed by our advanced computer vision models.</p>
        </div>
        <div className="results-grid">
          {RESULT_GALLERY.map((result) => (
            <div key={result.id} className="result-card" onClick={() => setSelectedResult(result)}>
              <div className="result-card__image">
                <img 
                  src={result.thumb} 
                  alt={result.name} 
                  loading="eager" 
                  decoding="async"
                />
              </div>
              <div className="result-card__info" style={{ justifyContent: 'center' }}>
                <button className="btn btn--sm btn--primary">Inspect Diagram</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedResult && (
        <PredictionModal
          pageData={{
            page: selectedResult.name,
            image_url: selectedResult.url,
            detected_image_url: selectedResult.detectedUrl,
            detections: []
          }}
          apiBaseUrl=""
          isStatic={true}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
}

export default LandingPage;
