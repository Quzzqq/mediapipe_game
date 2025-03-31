import { useRef, useState } from "react";
import Webcam from "react-webcam";
import { PointGenerator } from "./PointGenerator";
import { MpPlayer } from "./MpPlayer";

const App = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [score, setScore] = useState(0);
  const [cameraIsReady, setCameraIsReady] = useState(false);
  const [gameIsReady, setGameIsReady] = useState(false);

  const handleScoreIncrease = () => {
    setScore((prevScore) => prevScore + 1);
  };

  const handleClick = () => {
    setGameIsReady((prev) => !prev);
  };
  return (
    <div className="w-full h-svh flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold mb-4">Score: {score}</h1>
      <MpPlayer
        canvasRef={canvasRef}
        webcamRef={webcamRef}
        onChange={() => setCameraIsReady(true)}
      />
      {gameIsReady && (
        <PointGenerator canvasRef={canvasRef} onHit={handleScoreIncrease} />
      )}
      {cameraIsReady && (
        <button
          className="w-56 h-16 bg-amber-300 mt-10 rounded-2xl"
          onClick={handleClick}
        >
          {!gameIsReady ? "Начать игру" : "Закончить игру"}
        </button>
      )}
    </div>
  );
};

export default App;
