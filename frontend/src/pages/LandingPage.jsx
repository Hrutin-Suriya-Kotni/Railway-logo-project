import { Link } from "react-router-dom";

function LandingPage() {
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
              improving operational efficiency and reducing manual effort. It serves industries such as banking, 
              manufacturing, logistics, and healthcare. Known for its customer-centric approach, Ahana delivers 
              scalable and cost-effective technology solutions. The company emphasizes innovation, quality, 
              and long-term partnerships.
            </p>
          </div>

          <div className="hero__actions">
            <Link to="/demo" className="btn btn--large btn--primary">
              Try Demo
            </Link>
          </div>
        </div>
      </section>

      <section className="features">
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
      </section>
    </div>
  );
}

export default LandingPage;
