import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { Holistic, POSE_CONNECTIONS } from "@mediapipe/holistic";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Camera } from "@mediapipe/camera_utils";

const App = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Состояние для хранения координат клика
  const [clickPosition, setClickPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const holistic = new Holistic({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    });

    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    holistic.onResults(onResults);

    let camera: Camera | null = null;
    if (webcamRef.current?.video) {
      camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          await holistic.send({ image: webcamRef.current!.video! });
        },
      });
      camera.start();
    }

    return () => {
      camera?.stop();
      holistic.close();
    };
  }, []);

  const onResults = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Зеркальное отображение
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);

    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: "white",
      });
      const handLandmarks = [
        ...results.poseLandmarks.slice(11, 17),
        ...results.poseLandmarks.slice(17, 23),
      ];
      drawLandmarks(ctx, handLandmarks, {
        color: "white",
        fillColor: "rgb(255,138,0)",
      });
    }

    // Отрисовка точки в месте клика
    if (clickPosition) {
      const { x, y } = clickPosition;
      const mirroredX = canvas.width - x; // Зеркальное отображение X
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(mirroredX, y, 5, 0, Math.PI * 2); // Рисуем круг радиусом 5px
      ctx.fill();
    }

    ctx.restore();
  };

  // Обработчик кликов на canvas
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setClickPosition({ x, y });
  };

  const clickStyles = clickPosition
    ? {
        position: "absolute",
        left: `${clickPosition.x}px`,
        top: `${clickPosition.y}px`,
        width: "20px",
        height: "20px",
        backgroundColor: "red",
        borderRadius: "50%",
      }
    : {};

  return (
    <div className="w-full h-svh flex justify-center items-center">
      <div className="relative">
        <Webcam
          audio={false}
          ref={webcamRef}
          width={640}
          height={480}
          className="rounded-3xl transform scale-x-[-1]"
        />
        <canvas
          ref={canvasRef}
          className="rounded-3xl absolute top-0 left-0"
          width={640}
          height={480}
          onClick={handleCanvasClick}
        />
        <div style={clickStyles}></div>
      </div>
    </div>
  );
};

export default App;
