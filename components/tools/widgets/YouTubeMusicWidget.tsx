'use client';

import React, { useState } from 'react';

const YouTubeMusicWidget = React.memo(() => {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="relative w-full h-full backdrop-blur-sm bg-white/5 rounded-xl overflow-hidden border border-white/10 shadow-inner">
      {/* Header */}
      <div className="absolute top-2 left-3 right-3 flex justify-between items-center text-xs text-white/70 select-none z-10">
        <span>YouTube Music</span>
        <div className="flex items-center gap-2">
          <span className="text-white/50">Streaming Music</span>
          <a
            href="https://music.youtube.com/watch?v=kYpGTCMQ0E0&list=PL5W8gUxzvd3iYBAgqKpfpIo3OiOCjdW9I"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors"
            title="Open in new tab"
          >
            ↗
          </a>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full mx-auto mb-2"></div>
            <div className="text-sm">Loading YouTube Music...</div>
          </div>
        </div>
      )}

      {/* YouTube Music iframe */}
      <div className="w-full h-full pt-8">
        <iframe
          src="https://music.youtube.com/watch?v=kYpGTCMQ0E0&list=PL5W8gUxzvd3iYBAgqKpfpIo3OiOCjdW9I"
          className="w-full h-full border-0 rounded-b-xl"
          title="YouTube Music"
          onLoad={handleLoad}
          allow="autoplay; encrypted-media; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
        />
      </div>

      {/* Note about functionality */}
      <div className="absolute bottom-2 left-3 right-3 text-xs text-white/40 select-none">
        <div className="text-center">
          Note: You may need to sign in to YouTube Music for full functionality
        </div>
      </div>
    </div>
  );
});

YouTubeMusicWidget.displayName = 'YouTubeMusicWidget';

export default YouTubeMusicWidget;
