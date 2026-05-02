import { useState } from "react";
import PredictionView from "./PredictionView.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function PredictionGallery({ pages, resultsUrl }) {
  const [viewMode, setViewMode] = useState("compare"); // 'original' or 'compare'

  const triggerDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const handleDownload = () => {
    if (!resultsUrl) return;
    triggerDownload(resultsUrl, "predictions.json");
  };

  const downloadImage = (url, filename) => {
    triggerDownload(url, filename);
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
