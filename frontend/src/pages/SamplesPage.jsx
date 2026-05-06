import { useState } from "react";
import PredictionModal from "../components/PredictionModal";

const SAMPLES = [
  { id: 1, name: "Approved SIP Anpra", url: "/samples/Approved SIP of ANPRA_page_1.jpg" },
  { id: 2, name: "Signal Aspect Block", url: "/samples/SIGNAL ASPECT BLOCK_page_1.jpg" },
  { id: 3, name: "Bhuchchu SIP", url: "/samples/BHUCHCHU_SIP_page_1.jpg" },
  { id: 4, name: "Sathi SIP", url: "/samples/Sathi_SIP_page_1.jpg" },
  { id: 5, name: "Balamau SIP", url: "/samples/Balamau_SIP_page_1.jpg" },
  { id: 6, name: "Thalwara Mod RCC", url: "/samples/Thalwara Mod_RCC_page_1.jpg" },
];

function SamplesPage() {
  const [selectedSample, setSelectedSample] = useState(null);

  return (
    <div className="samples-page">
      <header className="page-header">
        <h1>Infrastructure Sample Library</h1>
        <p>Explore high-resolution technical documentation processed by CHITRA Vision Intelligence.</p>
      </header>

      <div className="samples-grid">
        {SAMPLES.map((sample) => (
          <div key={sample.id} className="sample-card" onClick={() => setSelectedSample(sample)}>
            <div className="sample-card__preview">
              <img src={sample.url} alt={sample.name} />
            </div>
            <div className="sample-card__info">
              <h3>{sample.name}</h3>
              <button className="btn btn--sm">Inspect Diagram</button>
            </div>
          </div>
        ))}
      </div>

      {selectedSample && (
        <PredictionModal
          pageData={{
            page: selectedSample.name,
            image_url: selectedSample.url,
            detected_image_url: selectedSample.url, // No boxes for samples
            detections: []
          }}
          apiBaseUrl="" // Static assets don't need API base
          isStatic={true}
          onClose={() => setSelectedSample(null)}
        />
      )}
    </div>
  );
}

export default SamplesPage;
