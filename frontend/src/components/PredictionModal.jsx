import { useState, useEffect } from "react";
import PredictionView from "./PredictionView";

function PredictionModal({ pageData, apiBaseUrl, onClose, isStatic = false }) {
  const [showBoxes, setShowBoxes] = useState(isStatic ? true : !isStatic);
  const [zoom, setZoom] = useState(1.0);

  // Handle Lifecycle: Scroll Lock & Wheel Zoom
  useEffect(() => {
    // 1. Lock Background Scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 2. Wheel Zoom Logic (Ctrl + Wheel)
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.min(Math.max(prev + delta, 0.25), 10.0));
      }
    };

    const modalContent = document.querySelector(".prediction-view--full");
    if (modalContent) {
      modalContent.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      // Cleanup
      document.body.style.overflow = originalOverflow || "auto";
      if (modalContent) {
        modalContent.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 10.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.25));
  const handleResetZoom = () => setZoom(1.0);

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
          <h3>{isStatic ? "Sample Inspection" : `Page ${pageData.page}`} - {pageData.page}</h3>
          <div className="modal-controls">
            <div className="zoom-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px', borderRight: '1px solid #475569', paddingRight: '16px' }}>
              <button className="btn btn--sm" onClick={handleZoomOut} title="Zoom Out">-</button>
              <span style={{ fontSize: '0.85rem', minWidth: '45px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
              <button className="btn btn--sm" onClick={handleZoomIn} title="Zoom In">+</button>
              <button className="btn btn--sm" onClick={handleResetZoom}>Reset</button>
            </div>
            
            {(pageData.detected_image_url && pageData.detected_image_url !== pageData.image_url) && (
              <button
                className={`btn ${showBoxes ? "btn--active" : ""}`}
                onClick={() => setShowBoxes(!showBoxes)}
              >
                {showBoxes ? "View Original" : "Compare Results"}
              </button>
            )}

            {!isStatic && (
              <button
                className="btn btn--primary"
                onClick={() => triggerDownload(`${apiBaseUrl}${pageData.detected_image_url}`, `page_${pageData.page}_detections.jpg`)}
              >
                Download
              </button>
            )}
            
            <button className="btn btn--secondary" onClick={onClose}>
              {isStatic ? "Close" : "← Back"}
            </button>
          </div>
        </header>

        <div className="modal-body">
          <PredictionView
            image_url={isStatic ? pageData.image_url : `${apiBaseUrl}${pageData.image_url}`}
            detected_image_url={isStatic ? (pageData.detected_image_url || pageData.image_url) : `${apiBaseUrl}${pageData.detected_image_url}`}
            showBoxes={showBoxes}
            zoom={zoom}
            fullHeight={true}
          />
        </div>
      </div>
    </div>
  );
}

export default PredictionModal;
