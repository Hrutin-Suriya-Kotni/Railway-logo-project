function ProgressDisplay({
  status,
  progress,
  jobId,
  resultPath,
  connectionState,
}) {
  const displayStatus = (() => {
    if (status === "done") {
      return "Completed";
    }
    if (status === "processing") {
      return "Processing";
    }
    if (status === "uploading") {
      return "Uploading";
    }
    return "Idle";
  })();

  return (
    <section className="progress-card">
      <h2>Status</h2>
      <p>{displayStatus}</p>
      <div className="progress-bar">
        <div
          className="progress-bar__fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p>{progress}%</p>
      {jobId && <p className="progress-card__meta">Job ID: {jobId}</p>}
      {connectionState && (
        <p className="progress-card__meta">
          WebSocket: {connectionState}
        </p>
      )}
    </section>
  );
}

export default ProgressDisplay;
