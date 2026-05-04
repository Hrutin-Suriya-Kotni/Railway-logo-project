import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

function PredictionView({ image_url, detected_image_url, showBoxes, fullHeight = false }) {
  const currentImage = showBoxes ? detected_image_url : image_url;

  return (
    <div className={`prediction-view ${fullHeight ? "prediction-view--full" : ""}`}>
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={10}
        centerOnInit={true}
      >
        <TransformComponent
          wrapperStyle={{ 
            width: "100%", 
            height: fullHeight ? "100%" : "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          contentStyle={{ 
            width: "100%",
            height: fullHeight ? "100%" : "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div className="prediction-container">
            <img
              src={currentImage}
              alt="Prediction page"
              className="prediction-image"
              style={{
                maxWidth: "100%",
                maxHeight: fullHeight ? "100%" : "none",
                objectFit: "contain"
              }}
            />
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}

export default PredictionView;
