import { useEffect, useRef, useState } from "react";

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onHit: () => void; // Функция для увеличения счета
};

type Point = {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
};

export const PointGenerator = ({ canvasRef, onHit }: Props) => {
  const [points, setPoints] = useState<Point[]>([]);
  const pointIdCounter = useRef(0);

  // Генерация новой точки
  const generatePoint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const id = pointIdCounter.current++;
    const x = Math.random() * (canvas.width - 40) + 20;
    const y = Math.random() * (canvas.height - 40) + 20;
    const radius = 20;
    const color = "red";

    const newPoint: Point = { id, x, y, radius, color };
    setPoints((prevPoints) => [...prevPoints, newPoint]);

    // Удаляем точку через 3 секунды
    setTimeout(() => {
      setPoints((prevPoints) => prevPoints.filter((p) => p.id !== id));
    }, 3000);
  };

  // Отрисовка точек
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        ctx.fillStyle = point.color;
        ctx.fill();
        ctx.closePath();
      });
    };

    draw();
  }, [points, canvasRef]);

  // Генерация точек каждые 2 секунды
  useEffect(() => {
    const interval = setInterval(generatePoint, 2000);
    return () => clearInterval(interval);
  }, []);

  // Проверка на столкновение
  useEffect(() => {
    const checkCollision = (handX: number, handY: number) => {
      setPoints((prevPoints) => {
        const updatedPoints = prevPoints.filter((point) => {
          const distance = Math.sqrt(
            (handX - point.x) ** 2 + (handY - point.y) ** 2
          );
          if (distance <= point.radius) {
            onHit(); // Увеличиваем счет
            return false; // Удаляем точку
          }
          return true;
        });
        return updatedPoints;
      });
    };

    window.addEventListener("collision", (e: any) => {
      checkCollision(e.detail.handX, e.detail.handY);
    });

    return () => {
      window.removeEventListener("collision", () => {});
    };
  }, [onHit]);

  return null;
};
