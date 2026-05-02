import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

function PredictionView({ image_url, detections, showBoxes }) {
  return (
    <div className="prediction-view">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={8}
        centerOnInit={true}
      >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "auto" }}
          contentStyle={{ width: "100%" }}
        >
              <div className="prediction-container">
                <img
                  src={image_url}
                  alt="Prediction page"
                  className="prediction-image"
                />
                {showBoxes &&
                  detections.map((det, i) => {
                    const { x, y, width, height } = det.bbox;
                    return (
                      <div
                        key={i}
                        className="bounding-box"
                        style={{
                          left: `${x * 100}%`,
                          top: `${y * 100}%`,
                          width: `${width * 100}%`,
                          height: `${height * 100}%`,
                        }}
                        title={`${det.label} (${(det.confidence * 100).toFixed(1)}%)`}
                      >
                        <span className="bounding-box__label">
                          {det.label} {(det.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
              </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}

export default PredictionView;
