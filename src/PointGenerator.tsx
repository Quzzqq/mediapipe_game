import { useEffect, useRef, useState } from "react";

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onHit: (points: number) => void; // Теперь принимает количество баллов
};

type Point = {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  createdAt: number; // Время создания точки
  timeLeft: number; // Оставшееся время
};

export const PointGenerator = ({ canvasRef, onHit }: Props) => {
  const [points, setPoints] = useState<Point[]>([]);
  const pointIdCounter = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Генерация новой точки
  const generatePoint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const id = pointIdCounter.current++;
    const x = Math.random() * (canvas.width - 40) + 20;
    const y = Math.random() * (canvas.height - 40) + 20;
    const radius = 20;
    const color = "red";
    const createdAt = Date.now();

    const newPoint: Point = {
      id,
      x,
      y,
      radius,
      color,
      createdAt,
      timeLeft: 3000,
    };
    setPoints((prevPoints) => [...prevPoints, newPoint]);

    // Удаляем точку через 3 секунды
    setTimeout(() => {
      setPoints((prevPoints) => prevPoints.filter((p) => p.id !== id));
    }, 3000);
  };

  // Отрисовка точек с текстом баллов
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      points.forEach((point) => {
        let pointsText = "1";
        let pointsColor = "red";
        if (point.timeLeft > 2000) {
          pointsText = "3";
          pointsColor = "green";
        } else if (point.timeLeft > 1000) {
          pointsText = "2";
          pointsColor = "yellow";
        }

        // Рисуем круг
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        ctx.fillStyle = pointsColor;
        ctx.fill();
        ctx.closePath();

        // Рисуем текст с баллами

        ctx.fillStyle = "white";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pointsText, point.x, point.y);
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [points, canvasRef]);

  // Обновляем оставшееся время для точек
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = Date.now();
      const deltaTime = now - lastTimeRef.current;
      lastTimeRef.current = now;

      setPoints((prevPoints) =>
        prevPoints.map((point) => ({
          ...point,
          timeLeft: Math.max(0, point.timeLeft - deltaTime),
        }))
      );
    };

    const interval = setInterval(updateTimeLeft, 100);
    lastTimeRef.current = Date.now();

    return () => clearInterval(interval);
  }, []);

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
            // Определяем количество баллов в зависимости от времени
            let points = 1;
            if (point.timeLeft > 2000) {
              points = 3;
            } else if (point.timeLeft > 1000) {
              points = 2;
            }
            onHit(points); // Передаем количество баллов
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
