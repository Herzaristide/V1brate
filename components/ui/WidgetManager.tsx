'use client';

import {
  saveWidgetLayout,
  loadWidgetLayout,
  clearWidgetLayout
} from '../../utils/widgetStorage';
import Widget from './Widget';
import React, { useState, useCallback, useEffect } from 'react';

export interface WidgetConfig {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  defaultWidth: number;
  defaultHeight: number;
  props?: any;
}

export interface WidgetInstance extends WidgetConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WidgetManagerProps {
  availableWidgets: WidgetConfig[];
  className?: string;
}

export default function WidgetManager({
  availableWidgets,
  className
}: WidgetManagerProps) {
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved layout on mount
  useEffect(() => {
    const savedWidgets = loadWidgetLayout();
    if (savedWidgets.length > 0) {
      // Merge with available widgets to ensure components are available
      const restoredWidgets = savedWidgets
        .map((savedWidget) => {
          const config = availableWidgets.find(
            (w) => w.id === savedWidget.id.split('-')[0]
          );
          if (config) {
            return {
              ...config,
              id: savedWidget.id,
              x: savedWidget.x,
              y: savedWidget.y,
              width: savedWidget.width,
              height: savedWidget.height
            };
          }
          return null;
        })
        .filter(Boolean) as WidgetInstance[];

      setWidgets(restoredWidgets);
    }
    setIsLoaded(true);
  }, [availableWidgets]);

  // Save layout when widgets change
  useEffect(() => {
    if (isLoaded) {
      saveWidgetLayout(widgets);
    }
  }, [widgets, isLoaded]);

  // Add widget
  const addWidget = useCallback((widgetConfig: WidgetConfig) => {
    const newWidget: WidgetInstance = {
      ...widgetConfig,
      id: `${widgetConfig.id}-${Date.now()}`,
      x: Math.random() * 300, // Random initial position
      y: Math.random() * 200,
      width: widgetConfig.defaultWidth,
      height: widgetConfig.defaultHeight
    };
    setWidgets((prev) => [...prev, newWidget]);
    setShowAddMenu(false);
  }, []);

  // Move widget
  const moveWidget = useCallback((id: string, x: number, y: number) => {
    setWidgets((prev) =>
      prev.map((widget) => (widget.id === id ? { ...widget, x, y } : widget))
    );
  }, []);

  // Resize widget
  const resizeWidget = useCallback(
    (id: string, width: number, height: number) => {
      setWidgets((prev) =>
        prev.map((widget) =>
          widget.id === id ? { ...widget, width, height } : widget
        )
      );
    },
    []
  );

  // Remove widget
  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((widget) => widget.id !== id));
  }, []);

  // Clear all widgets
  const clearAllWidgets = useCallback(() => {
    setWidgets([]);
    clearWidgetLayout();
  }, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Control Panel */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        {/* Clear All Button */}
        {widgets.length > 0 && (
          <button
            onClick={clearAllWidgets}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg shadow-lg transition-colors text-sm"
          >
            Clear All
          </button>
        )}

        {/* Add Widget Button */}
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          Add Widget
        </button>

        {/* Add Widget Menu */}
        {showAddMenu && (
          <div className="absolute top-12 right-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg p-2 min-w-48">
            {availableWidgets.map((widget) => (
              <button
                key={widget.id}
                onClick={() => addWidget(widget)}
                className="w-full text-left px-3 py-2 text-white hover:bg-white/20 rounded transition-colors"
              >
                {widget.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {widgets.length === 0 && isLoaded && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white/70">
            <div className="text-6xl mb-4">🎵</div>
            <div className="text-xl mb-2">Welcome to V1brate</div>
            <div className="text-sm">Click "Add Widget" to get started</div>
          </div>
        </div>
      )}

      {/* Widgets */}
      {widgets.map((widget) => {
        const Component = widget.component;
        return (
          <Widget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            x={widget.x}
            y={widget.y}
            width={widget.width}
            height={widget.height}
            onMove={moveWidget}
            onResize={resizeWidget}
            onClose={removeWidget}
          >
            <Component {...(widget.props || {})} />
          </Widget>
        );
      })}

      {/* Background overlay when add menu is open */}
      {showAddMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowAddMenu(false)}
        />
      )}
    </div>
  );
}
