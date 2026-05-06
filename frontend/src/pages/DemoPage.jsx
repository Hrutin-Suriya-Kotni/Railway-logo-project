import { useState, useCallback } from "react";
import UploadForm from "../components/UploadForm";
import ProgressDisplay from "../components/ProgressDisplay";
import PredictionGallery from "../components/PredictionGallery";
import PdfModal from "../components/PdfModal";
import useJobWebSocket from "../hooks/useJobWebSocket";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SAMPLE_FILES = [
  { name: "Signal Aspect Block", filename: "SIGNAL ASPECT BLOCK.pdf", url: "/demo_files/SIGNAL ASPECT BLOCK.pdf" },
  { name: "Semra PH-2 SIP", filename: "SEMRA PH-2_SIP.pdf", url: "/demo_files/SEMRA PH-2_SIP.pdf" },
  { name: "Sathi SIP", filename: "Sathi_SIP.pdf", url: "/demo_files/Sathi_SIP.pdf" },
  { name: "Thalwara Mod RCC", filename: "Thalwara Mod_RCC.pdf", url: "/demo_files/Thalwara Mod_RCC.pdf" },
];

function DemoPage() {
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [resultData, setResultData] = useState(null);
  const [resultPath, setResultPath] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewPdf, setPreviewPdf] = useState(null);

  const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

  const handleUpload = async (file) => {
    setIsUploading(true);
    setStatus("uploading");
    setProgress(0);
    setError("");
    setResultData(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed.");
      }

      const data = await response.json();
      setJobId(data.job_id);
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSampleAnalyze = async (sampleUrl, sampleName) => {
    try {
      setStatus("fetching-sample");
      const response = await fetch(sampleUrl);
      if (!response.ok) throw new Error("Failed to fetch sample.");
      const blob = await response.blob();
      const file = new File([blob], sampleName, { type: "application/pdf" });
      handleUpload(file);
    } catch (err) {
      setError("Failed to process sample file. Please try manual upload.");
      setStatus("idle");
    }
  };

  const handleMessage = useCallback((payload) => {
    if (payload.status === "processing") {
      setStatus("processing");
      setProgress(payload.progress || 0);
    } else if (payload.status === "done") {
      setStatus("done");
      setProgress(100);
      setResultData(payload);
      setResultPath(`${API_BASE_URL}/storage/results/${jobId}.json`);
    } else if (payload.status === "failed") {
      setStatus("failed");
      setError(payload.error || "Processing failed.");
    }
  }, [jobId]);

  const handleWebSocketError = useCallback((err) => {
    setError(err);
  }, []);

  const shouldReconnect = status !== "done" && status !== "idle";

  const connectionState = useJobWebSocket({
    jobId,
    wsBaseUrl: WS_BASE_URL,
    shouldReconnect,
    onMessage: handleMessage,
    onError: handleWebSocketError,
  });

  const handleReset = () => {
    setJobId("");
    setStatus("idle");
    setProgress(0);
    setError("");
    setResultData(null);
    setResultPath("");
  };

  return (
    <div className="demo-page">
      <header className="page-header">
        <h1>Live AI Intelligence Demo</h1>
        <p>Analyze your infrastructure documentation using our fine-tuned advanced computer vision models.</p>
      </header>

      <div className="demo-layout">
        <div className="demo-main">
          <section className="demo-section uploader-card">
            <h2>1. Document Analysis</h2>
            {(status === "idle" || status === "processing" || status === "uploading" || status === "fetching-sample") ? (
              <UploadForm onUpload={handleUpload} disabled={isUploading || status === "processing"} />
            ) : (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button onClick={handleReset} className="btn btn--secondary">Upload Another File</button>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Job Completed successfully.</span>
              </div>
            )}
            
            {(jobId || isUploading || status === "fetching-sample") && (
              <ProgressDisplay 
                status={status === "fetching-sample" ? "processing" : status} 
                progress={progress} 
                jobId={jobId}
                connectionState={connectionState}
                resultPath={resultPath}
              />
            )}

            {error && (
              <div className="app__error-container">
                <p className="app__error">Error: {error}</p>
                <button onClick={handleReset} className="btn btn--secondary">Try Again</button>
              </div>
            )}
          </section>

          {status === "done" && resultData && (
            <section className="demo-section results-container">
              <h2>2. Analysis Results</h2>
              <PredictionGallery 
                pages={resultData.pages} 
                resultsUrl={resultPath}
                totalPagesOriginal={resultData.total_pages_original}
              />
            </section>
          )}
        </div>

        <aside className="demo-sidebar">
          <div className="reference-card">
            <h3>Sample Files</h3>
            <p>Select a sample file to analyze immediately or preview the original document.</p>
            <div className="sample-files-list">
              {SAMPLE_FILES.map((file, idx) => (
                <div key={idx} className="sample-file-item">
                  <div className="sample-file-name">📄 {file.name}</div>
                  <div className="sample-file-actions">
                    <button 
                      className="btn btn--sm btn--primary" 
                      onClick={() => handleSampleAnalyze(file.url, file.filename)}
                      disabled={status !== "idle" && status !== "done"}
                    >
                      Analyze
                    </button>
                    <button 
                      className="btn btn--sm btn--secondary" 
                      onClick={() => setPreviewPdf(file)}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {previewPdf && (
        <PdfModal 
          url={previewPdf.url} 
          title={previewPdf.name} 
          onClose={() => setPreviewPdf(null)} 
        />
      )}
    </div>
  );
}

export default DemoPage;
