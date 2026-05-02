import { useState } from "react";
import PredictionView from "./PredictionView.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function PredictionGallery({ pages, resultsUrl }) {
  const [viewMode, setViewMode] = useState("compare"); // 'original' or 'compare'

  const handleDownload = () => {
    if (!resultsUrl) return;
    const link = document.createElement("a");
    link.href = resultsUrl;
    link.download = "predictions.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadImage = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="gallery">
      <header className="gallery__header">
        <h2>Results Gallery</h2>
        <div className="gallery__controls">
          <button
            className={`btn ${viewMode === "original" ? "btn--active" : ""}`}
            onClick={() => setViewMode("original")}
          >
            Original
          </button>
          <button
            className={`btn ${viewMode === "compare" ? "btn--active" : ""}`}
            onClick={() => setViewMode("compare")}
          >
            Compare
          </button>
          <button className="btn btn--primary" onClick={handleDownload}>
            Download Predictions
          </button>
        </div>
      </header>

      <div className="gallery__list">
        {pages.map((pageData) => (
          <div key={pageData.page} className="prediction-item">
            <div className="prediction-item__info">
              <div className="prediction-item__header">
                <h3>Page {pageData.page}</h3>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => downloadImage(`${API_BASE_URL}${pageData.detected_image_url}`, `page_${pageData.page}_detections.jpg`)}
                >
                  Download Image with Boxes
                </button>
              </div>
              <p>{pageData.detections.length} objects detected</p>
            </div>
            <PredictionView
              image_url={`${API_BASE_URL}${pageData.image_url}`}
              detections={pageData.detections}
              showBoxes={viewMode === "compare"}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default PredictionGallery;
