function PredictionView({ image_url, detected_image_url, showBoxes, zoom = 1, fullHeight = false, interactive = true }) {
  const currentImage = showBoxes ? detected_image_url : image_url;

  if (!interactive) {
    return (
      <div className="prediction-view prediction-view--static">
        <img src={currentImage} alt="Preview" className="prediction-image" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
    );
  }

  return (
    <div className={`prediction-view ${fullHeight ? "prediction-view--full" : ""}`} style={{ overflow: 'auto' }}>
      <div 
        className="prediction-container" 
        style={{ 
          width: `${zoom * 100}%`,
          transition: 'width 0.2s ease-in-out'
        }}
      >
        <img
          src={currentImage}
          alt="Prediction page"
          className="prediction-image"
          style={{
            width: "100%",
            height: "auto",
            display: "block"
          }}
        />
      </div>
    </div>
  );
}

export default PredictionView;
