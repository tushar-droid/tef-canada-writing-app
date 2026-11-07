import { useEffect, useState, useRef } from 'react';
import { IconClock } from './Icons';

interface TimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
  onTick?: (remainingSeconds: number) => void;
}

export function Timer({ totalSeconds, onTimeUp, onTick }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const timeUpCalledRef = useRef(false);

  useEffect(() => {
    setTimeLeft(totalSeconds);
    timeUpCalledRef.current = false;
  }, [totalSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!timeUpCalledRef.current) {
        timeUpCalledRef.current = true;
        onTimeUp();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (onTick) onTick(next);
        if (next <= 0) {
          clearInterval(interval);
          if (!timeUpCalledRef.current) {
            timeUpCalledRef.current = true;
            onTimeUp();
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onTimeUp, onTick]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLowTime = timeLeft <= 300 && timeLeft > 60; // < 5 mins
  const isCriticalTime = timeLeft <= 60; // < 1 min

  return (
    <div
      className={`timer-badge ${isCriticalTime ? 'critical' : isLowTime ? 'warning' : 'normal'}`}
      title="Temps restant pour l'épreuve"
    >
      <IconClock size={16} />
      <span className="timer-text">{formatted}</span>
      {isCriticalTime && <span className="timer-pulse" />}
    </div>
  );
}
