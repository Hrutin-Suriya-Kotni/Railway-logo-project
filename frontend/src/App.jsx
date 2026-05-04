import { useCallback, useState, useEffect } from "react";
import UploadForm from "./components/UploadForm.jsx";
import ProgressDisplay from "./components/ProgressDisplay.jsx";
import PredictionGallery from "./components/PredictionGallery.jsx";
import useJobWebSocket from "./hooks/useJobWebSocket.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";

function App() {
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [resultPath, setResultPath] = useState("");
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const fetchResults = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/storage/results/${id}.json`);
      if (response.ok) {
        const data = await response.json();
        setResultData(data);
      }
    } catch (err) {
      console.error("Failed to fetch results", err);
    }
  }, []);

  const handleUpload = useCallback(async (file) => {
    setError("");
    setStatus("uploading");
    setProgress(0);
    setResultPath("");
    setResultData(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const detail = await response.json();
        throw new Error(detail.detail || "Upload failed.");
      }

      const data = await response.json();
      setJobId(data.job_id);
      setStatus("processing");
      setProgress(0);
    } catch (uploadError) {
      setError(uploadError.message);
      setStatus("idle");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleMessage = useCallback((message) => {
    if (message.error) {
      setError(message.error);
    }
    if (message.status === "processing") {
      setStatus("processing");
      setProgress(message.progress ?? 0);
    }
    if (message.status === "done") {
      setStatus("done");
      setProgress(100);
      setResultPath(message.result_path || "");
      if (message.job_id) {
        fetchResults(message.job_id);
      }
    }
  }, [fetchResults]);

  const handleWebSocketError = useCallback((wsError) => {
    console.error(wsError);
    if (status !== "done") {
      setError(wsError);
    }
  }, [status]);

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
    setIsUploading(false);
  };

  const isProcessing = isUploading || (status !== "idle" && status !== "done" && status !== "failed");

  return (
    <div className="site-wrapper">
      <header className="site-header">
        <div className="site-header__container">
          <div className="header__brand" onClick={handleReset} style={{ cursor: 'pointer' }}>
            <h1>CHITRA</h1>
            <span className="header__tagline">RCC LOGO Recognition</span>
          </div>
          <nav className="site-nav">
            <ul>
              <li><a href="#" className="active" onClick={(e) => { e.preventDefault(); handleReset(); }}>Dashboard</a></li>
              <li><a href="#">History</a></li>
              <li><a href="#">Settings</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="app">
        <section className="app__intro">
          <h2>CHITRA Inference Engine</h2>
          <p>Upload your PDF to identify and extract logo bounding boxes using our advanced finetuned model.</p>
        </section>

        {status === "idle" || status === "processing" ? (
          <UploadForm key={jobId || "new"} onUpload={handleUpload} disabled={isProcessing} />
        ) : null}

        <ProgressDisplay
          status={status}
          progress={progress}
          jobId={jobId}
          resultPath={resultPath}
          connectionState={connectionState}
        />

        {error && (
          <div className="app__error-container">
            <p className="app__error">Error: {error}</p>
            <button onClick={handleReset} className="btn btn--secondary">Try Again</button>
          </div>
        )}

        {status === "done" && resultData && (
          <div className="gallery-container">
            <PredictionGallery
              pages={resultData.pages}
              resultsUrl={`${API_BASE_URL}/storage/results/${jobId}.json`}
              totalPagesOriginal={resultData.total_pages_original}
            />
            <div className="gallery-actions" style={{ marginTop: '40px', justifyContent: 'center' }}>
              <button onClick={handleReset} className="btn btn--primary">
                + Upload Another PDF
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="site-footer">
        <p>&copy; 2026 CHITRA AI</p>
      </footer>
    </div>
  );
}

export default App;
