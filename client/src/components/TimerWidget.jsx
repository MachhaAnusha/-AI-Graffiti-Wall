import React, { useState, useEffect, useRef } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const TimerWidget = ({ 
  duration: initialDuration = 180, // 3 minutes default
  onExpire,
  className = '',
  showControls = true
}) => {
  const [duration, setDuration] = useState(initialDuration);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsPaused(false);
            if (onExpire) onExpire();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused, timeLeft, onExpire]);

  const handleStart = () => {
    if (timeLeft === 0) {
      setTimeLeft(duration);
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
  const progress = duration > 0 ? (timeLeft / duration) * 100 : 0;

  // Timer colors based on time remaining
  const getTimerColor = () => {
    if (timeLeft === 0) return 'var(--text-muted)';
    if (timeLeft <= 30) return 'var(--accent-secondary)'; // Red for danger
    if (timeLeft <= 60) return 'var(--accent-orange)'; // Orange for warning
    return 'var(--accent-primary)'; // Yellow for normal
  };

  const timerContent = (
    <>
      {/* Circular Progress */}
      <div className="session-timer">
        <div className="relative w-full h-full">
          <CircularProgressbar
            value={progress}
            text={formatTime(timeLeft)}
            styles={buildStyles({
              textColor: getTimerColor(),
              pathColor: getTimerColor(),
              trailColor: 'var(--border-color)',
              strokeLinecap: 'round',
              textSize: '16px',
              pathTransitionDuration: 0.5,
            })}
            className="timer-circle"
          />
          
          {/* Status indicator */}
          <div className="absolute inset-0 flex items-center justify-center mt-8">
            <div className="text-xs text-muted font-semibold">
              {isRunning ? (isPaused ? 'PAUSED' : 'RUNNING') : 'READY'}
            </div>
          </div>
        </div>
      </div>

      {showControls && (
        <div className="mt-4 space-y-3">
          {/* Duration Setting */}
          <div>
            <label className="text-xs text-muted block mb-2">
              Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </label>
            <input
              type="range"
              min="60"
              max="1800"
              step="60"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              disabled={isRunning}
              className="w-full h-2 bg-tertiary rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${((duration - 60) / (1800 - 60)) * 100}%, var(--border-color) ${((duration - 60) / (1800 - 60)) * 100}%, var(--border-color) 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>1 min</span>
              <span>30 min</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="graffiti-button col-span-2"
                style={{ background: 'linear-gradient(135deg, var(--accent-green), var(--accent-primary))' }}
              >
                Start Session
              </button>
            ) : (
              <>
                <button
                  onClick={handlePause}
                  className="graffiti-button"
                  style={{ background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-yellow))' }}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={handleReset}
                  className="graffiti-button"
                  style={{ background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-red))' }}
                >
                  Reset
                </button>
              </>
            )}
          </div>

          {/* Timer Info */}
          <div className="text-xs text-muted text-center">
            <p className="font-semibold">Session Timer</p>
            <p>Auto-sends artwork when time expires</p>
          </div>
        </div>
      )}
    </>
  );

  if (className) {
    return (
      <div className={className}>
        {timerContent}
      </div>
    );
  }

  return (
    <div className="graffiti-panel">
      <h3 className="graffiti-title text-lg mb-4">Session Timer</h3>
      {timerContent}
    </div>
  );
};

export default TimerWidget;
