import { useState } from "react";

function UploadForm({ onUpload, disabled }) {
  const [file, setFile] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (file) {
      onUpload(file);
    }
  };

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="upload-form__label">
        Choose a PDF
        <input
          type="file"
          accept="application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          disabled={disabled}
        />
      </label>
      <button type="submit" disabled={!file || disabled} className={disabled ? "btn--loading" : ""}>
        {disabled ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span className="spinner"></span>
            Processing...
          </span>
        ) : (
          "Start Processing"
        )}
      </button>
    </form>
  );
}

export default UploadForm;
