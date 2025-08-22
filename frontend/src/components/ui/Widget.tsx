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
  isDraggable?: boolean;
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
  isResizable = true,
  isDraggable = true,
}: WidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) return;

    if (
      e.target === widgetRef.current ||
      (e.target as HTMLElement).closest('.widget-header')
    ) {
      const rect = widgetRef.current!.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
      e.preventDefault();
    }
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    if (!isResizable) return;

    setResizeStart({
      width,
      height,
      x: e.clientX,
      y: e.clientY,
    });
    setIsResizing(true);
    e.preventDefault();
    e.stopPropagation();
  };

  // Global mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && isDraggable) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Keep widget within viewport bounds
        const maxX = window.innerWidth - width;
        const maxY = window.innerHeight - height;

        onMove(
          id,
          Math.max(0, Math.min(newX, maxX)),
          Math.max(0, Math.min(newY, maxY))
        );
      }

      if (isResizing && isResizable) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        const newWidth = Math.max(200, resizeStart.width + deltaX);
        const newHeight = Math.max(150, resizeStart.height + deltaY);

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
  }, [
    isDragging,
    isResizing,
    dragOffset,
    resizeStart,
    id,
    onMove,
    onResize,
    width,
    height,
    isDraggable,
    isResizable,
  ]);

  return (
    <div
      ref={widgetRef}
      className={`absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${
        isDragging ? 'cursor-grabbing z-50' : ''
      } ${isResizing ? 'select-none' : ''}`}
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex: isDragging || isResizing ? 1000 : 10,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Widget Header */}
      <div
        className={`widget-header flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 ${
          isDraggable ? 'cursor-grab' : ''
        }`}
      >
        <h3 className='text-sm font-medium text-gray-900 dark:text-white select-none'>
          {title}
        </h3>
        <button
          onClick={() => onClose(id)}
          className='text-gray-400 hover:text-red-500 text-lg leading-none'
          title='Close widget'
        >
          ×
        </button>
      </div>

      {/* Widget Content */}
      <div
        className='widget-content p-4 h-full overflow-hidden'
        style={{ height: height - 60 }}
      >
        {children}
      </div>

      {/* Resize Handle */}
      {isResizable && (
        <div
          className='absolute bottom-0 right-0 w-4 h-4 bg-gray-300 dark:bg-gray-600 cursor-nw-resize opacity-50 hover:opacity-100'
          onMouseDown={handleResizeStart}
          style={{
            clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)',
          }}
        />
      )}
    </div>
  );
}
