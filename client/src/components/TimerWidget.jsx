import React, { useState, useEffect, useRef } from 'react';

const TimerWidget = ({ onComplete }) => {
  const [duration, setDuration] = useState(300); // 5 minutes default
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
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused, timeLeft, onComplete]);

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

  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

  return (
    <div className="bg-gray-900 p-4 rounded-lg border-2 border-pink-500">
      <h3 className="text-lg font-bold mb-4 neon-pink font-boogaloo">
        Session Timer
      </h3>

      {/* Circular Progress */}
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg className="w-32 h-32 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="#374151"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="#ff006e"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
            className="transition-all duration-1000"
            strokeLinecap="round"
          />
        </svg>
        
        {/* Timer display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold font-mono neon-blue">
              {formatTime(timeLeft)}
            </div>
            <div className="text-xs text-gray-400">
              {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Ready'}
            </div>
          </div>
        </div>
      </div>

      {/* Duration Setting */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
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
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1 min</span>
          <span>30 min</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="space-y-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="w-full graffiti-btn bg-green-600 text-sm"
          >
            Start Timer
          </button>
        ) : (
          <>
            <button
              onClick={handlePause}
              className="w-full graffiti-btn bg-yellow-600 text-sm"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleReset}
              className="w-full graffiti-btn bg-red-600 text-sm"
            >
              Reset
            </button>
          </>
        )}
      </div>

      {/* Timer Info */}
      <div className="mt-4 text-xs text-gray-400">
        <p>When timer ends, artwork will be automatically sent to display.</p>
      </div>
    </div>
  );
};

export default TimerWidget;
