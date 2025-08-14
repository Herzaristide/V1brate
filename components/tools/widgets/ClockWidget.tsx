'use client';

import { useState, useEffect } from 'react';

export default function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-white">
      <div className="text-4xl font-mono font-bold mb-2">
        {time.toLocaleTimeString()}
      </div>
      <div className="text-lg text-white/70">{time.toLocaleDateString()}</div>
    </div>
  );
}
