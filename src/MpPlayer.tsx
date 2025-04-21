import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Holistic, POSE_CONNECTIONS } from "@mediapipe/holistic";
import { RefObject, useEffect, useLayoutEffect } from "react";
import Webcam from "react-webcam";

type Props = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  pointsCanvasRef: RefObject<HTMLCanvasElement | null>;
  webcamRef: RefObject<Webcam | null>;
  onChange: () => void;
};

export const MpPlayer = ({
  canvasRef,
  pointsCanvasRef,
  webcamRef,
  onChange,
}: Props) => {
  useLayoutEffect(() => {
    const holistic = new Holistic({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    });

    holistic.setOptions({
      modelComplexity: 2,
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
        ...results.poseLandmarks.slice(11, 17), // Левая рука
        ...results.poseLandmarks.slice(17, 23), // Правая рука
      ];

      handLandmarks.forEach((landmark) => {
        const handX = canvas.width - landmark.x * canvas.width;
        const handY = landmark.y * canvas.height;

        // Создаем событие для проверки столкновения
        const event = new CustomEvent("collision", {
          detail: { handX, handY },
        });
        window.dispatchEvent(event);
      });

      drawLandmarks(ctx, handLandmarks, {
        color: "white",
        fillColor: "rgb(255,138,0)",
      });
    }

    ctx.restore();
  };

  return (
    <div className="relative">
      <Webcam
        audio={false}
        ref={webcamRef}
        width={640}
        height={480}
        className="rounded-3xl transform scale-x-[-1]"
        onLoadedData={onChange}
      />
      <canvas
        ref={canvasRef}
        className="rounded-3xl absolute top-0 left-0 z-10"
        width={640}
        height={480}
      />
      <canvas
        ref={pointsCanvasRef}
        className="rounded-3xl absolute top-0 left-0 z-20 pointer-events-none"
        width={640}
        height={480}
      />
    </div>
  );
};
