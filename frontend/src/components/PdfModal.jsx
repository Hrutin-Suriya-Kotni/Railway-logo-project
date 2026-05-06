import { useEffect } from "react";

function PdfModal({ url, title, onClose }) {
  // Lock background scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow || "auto";
    };
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--pdf" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h3>Preview: {title}</h3>
          <div className="modal-controls">
            <button className="btn btn--secondary" onClick={onClose}>Close Preview</button>
          </div>
        </header>
        <div className="modal-body modal-body--pdf">
          <iframe 
            src={`${url}#toolbar=0`} 
            width="100%" 
            height="100%" 
            title="PDF Preview"
            style={{ border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}

export default PdfModal;
