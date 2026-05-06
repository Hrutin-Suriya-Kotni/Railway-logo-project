import { useState, useCallback } from "react";
import UploadForm from "../components/UploadForm";
import ProgressDisplay from "../components/ProgressDisplay";
import PredictionGallery from "../components/PredictionGallery";
import useJobWebSocket from "../hooks/useJobWebSocket";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const REFERENCE_FILES = [
  { name: "Signal Aspect Block (Test)", url: "/demo_files/SIGNAL ASPECT BLOCK.pdf" },
  { name: "Semra PH-2 SIP (Test)", url: "/demo_files/SEMRA PH-2_SIP.pdf" },
  { name: "Sathi SIP (Test)", url: "/demo_files/Sathi_SIP.pdf" },
  { name: "Thalwara Mod RCC (Test)", url: "/demo_files/Thalwara Mod_RCC.pdf" },
];

function DemoPage() {
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [resultData, setResultData] = useState(null);
  const [resultPath, setResultPath] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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
        <p>Upload your own technical documentation or use our reference files below to witness real-time infrastructure detection.</p>
      </header>

      <div className="demo-layout">
        <div className="demo-main">
          <section className="demo-section uploader-card">
            <h2>1. Upload Infrastructure Documentation</h2>
            {(status === "idle" || status === "processing") ? (
              <UploadForm onUpload={handleUpload} disabled={isUploading || status === "processing"} />
            ) : (
              <button onClick={handleReset} className="btn btn--secondary">Upload Another File</button>
            )}

            {(jobId || isUploading) && (
              <ProgressDisplay
                status={status}
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
              <h2>2. AI Detection Results</h2>
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
            <h3>Reference Materials</h3>
            <p>Don't have a file? Open these in a new tab to see the originals, then save and upload them here.</p>
            <ul className="reference-list">
              {REFERENCE_FILES.map((file, idx) => (
                <li key={idx}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="reference-link">
                    📄 {file.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default DemoPage;
