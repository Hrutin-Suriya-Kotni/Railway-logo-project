import { useState } from "react";
import PredictionView from "./PredictionView";

function PredictionModal({ pageData, apiBaseUrl, onClose }) {
  const [showBoxes, setShowBoxes] = useState(true);

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h3>Page {pageData.page} - Detailed View</h3>
          <div className="modal-controls">
            <button
              className={`btn ${!showBoxes ? "btn--active" : ""}`}
              onClick={() => setShowBoxes(!showBoxes)}
            >
              {showBoxes ? "View Original" : "View Boxes"}
            </button>
            <button
              className="btn btn--primary"
              onClick={() => triggerDownload(`${apiBaseUrl}${pageData.detected_image_url}`, `page_${pageData.page}_detections.jpg`)}
            >
              Download High-Res
            </button>
            <button className="btn btn--secondary" onClick={onClose}>
              ← Back to Gallery
            </button>
          </div>
        </header>

        <div className="modal-body">
          <PredictionView
            image_url={`${apiBaseUrl}${pageData.image_url}`}
            detected_image_url={`${apiBaseUrl}${pageData.detected_image_url}`}
            showBoxes={showBoxes}
            fullHeight={true}
          />
        </div>
      </div>
    </div>
  );
}

export default PredictionModal;
