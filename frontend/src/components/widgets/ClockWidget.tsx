import React, { useState, useEffect } from 'react';

const ClockWidget: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [showSeconds, setShowSeconds] = useState(true);
  const [format24h, setFormat24h] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    if (format24h) {
      return showSeconds
        ? date.toLocaleTimeString('en-US', { hour12: false })
        : date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          });
    } else {
      return showSeconds
        ? date.toLocaleTimeString('en-US', { hour12: true })
        : date.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
          });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className='flex flex-col h-full items-center justify-center'>
      {/* Time Display */}
      <div className='text-center mb-4'>
        <div className='text-3xl font-mono font-bold text-gray-900 dark:text-white mb-2'>
          {formatTime(time)}
        </div>
        <div className='text-sm text-gray-600 dark:text-gray-300'>
          {formatDate(time)}
        </div>
      </div>

      {/* Settings */}
      <div className='space-y-2'>
        <div className='flex items-center space-x-2'>
          <input
            type='checkbox'
            id='showSeconds'
            checked={showSeconds}
            onChange={(e) => setShowSeconds(e.target.checked)}
            className='rounded'
          />
          <label
            htmlFor='showSeconds'
            className='text-xs text-gray-700 dark:text-gray-300'
          >
            Show seconds
          </label>
        </div>

        <div className='flex items-center space-x-2'>
          <input
            type='checkbox'
            id='format24h'
            checked={format24h}
            onChange={(e) => setFormat24h(e.target.checked)}
            className='rounded'
          />
          <label
            htmlFor='format24h'
            className='text-xs text-gray-700 dark:text-gray-300'
          >
            24-hour format
          </label>
        </div>
      </div>
    </div>
  );
};

export default ClockWidget;
