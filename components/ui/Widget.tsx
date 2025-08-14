'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface WidgetProps {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children: React.ReactNode;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onClose: (id: string) => void;
  isResizable?: boolean;
}

export default function Widget({
  id,
  title,
  x,
  y,
  width,
  height,
  children,
  onMove,
  onResize,
  onClose,
  isResizable = true
}: WidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      e.target === widgetRef.current ||
      (e.target as HTMLElement).closest('.widget-header')
    ) {
      const rect = widgetRef.current!.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  // Handle resizing
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        onMove(id, Math.max(0, newX), Math.max(0, newY));
      } else if (isResizing) {
        const rect = widgetRef.current!.getBoundingClientRect();
        const newWidth = Math.max(200, e.clientX - rect.left);
        const newHeight = Math.max(150, e.clientY - rect.top);
        onResize(id, newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, id, onMove, onResize]);

  return (
    <div
      ref={widgetRef}
      className={`absolute bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex: isDragging || isResizing ? 1000 : 1
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Widget Header */}
      <div className="widget-header flex items-center justify-between p-2 border-b border-white/20 bg-white/5 rounded-t-lg">
        <h3 className="text-white font-semibold text-sm truncate">{title}</h3>
        <button
          onClick={() => onClose(id)}
          className="text-white/70 hover:text-white hover:bg-white/20 rounded p-1 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      {/* Widget Content */}
      <div
        className="p-2 h-full overflow-hidden"
        style={{ height: 'calc(100% - 40px)' }}
      >
        {children}
      </div>

      {/* Resize Handle */}
      {isResizable && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-white/20 hover:bg-white/30 transition-colors"
          style={{
            clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)'
          }}
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
}
