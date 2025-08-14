'use client';

import {
  saveWidgetLayout,
  loadWidgetLayout,
  clearWidgetLayout
} from '../../utils/widgetStorage';
import Widget from './Widget';
import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarContainer, setSidebarContainer] = useState<HTMLElement | null>(
    null
  );
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [noteMode, setNoteMode] = useState<'ABC' | 'DOREMI'>('ABC');
  const [accidentalMode, setAccidentalMode] = useState<'sharp' | 'flat'>(
    'sharp'
  );
  const [availableMicrophones, setAvailableMicrophones] = useState<
    MediaDeviceInfo[]
  >([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [availableMidiDevices, setAvailableMidiDevices] = useState<any[]>([]);
  const [selectedMidiDevice, setSelectedMidiDevice] = useState<string>('');

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

  // Get available microphones
  useEffect(() => {
    const getMicrophones = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const microphones = devices.filter(
          (device) => device.kind === 'audioinput'
        );
        setAvailableMicrophones(microphones);

        // Set default microphone if none selected
        if (microphones.length > 0 && !selectedMicrophone) {
          setSelectedMicrophone(microphones[0].deviceId);
        }
      } catch (error) {
        console.error('Error accessing microphones:', error);
      }
    };

    getMicrophones();
  }, [selectedMicrophone]);

  // Get available MIDI devices
  useEffect(() => {
    const getMidiDevices = async () => {
      if ('requestMIDIAccess' in navigator) {
        try {
          const midiAccess = await (navigator as any).requestMIDIAccess();
          const inputs: any[] = [];

          midiAccess.inputs.forEach((input: any) => {
            inputs.push({
              id: input.id,
              name: input.name || 'Unknown MIDI Device',
              manufacturer: input.manufacturer || ''
            });
          });

          setAvailableMidiDevices(inputs);

          // Set default MIDI device if none selected
          if (inputs.length > 0 && !selectedMidiDevice) {
            setSelectedMidiDevice(inputs[0].id);
          }
        } catch (error) {
          console.error('Error accessing MIDI devices:', error);
        }
      }
    };

    getMidiDevices();
  }, [selectedMidiDevice]);

  // Find sidebar container
  useEffect(() => {
    const container = document.getElementById('sidebar-content');
    setSidebarContainer(container);
  }, []);

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

  // Sidebar content component
  const SidebarContent = () => (
    <div className="flex flex-col h-full text-sm">
      {/* Mode Toggles */}
      <div className="mb-4 space-y-2">
        <h4 className="text-xs font-medium text-white/60 uppercase tracking-wide">
          Settings
        </h4>

        {/* Dark/Light Mode */}
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-xs">Theme</span>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-8 h-4 rounded-full transition-colors relative ${
              isDarkMode ? 'bg-blue-500' : 'bg-gray-400'
            }`}
          >
            <div
              className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${
                isDarkMode ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* ABC/DOREMI Mode */}
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-xs">Notes</span>
          <div className="flex rounded bg-white/10 p-0.5">
            <button
              onClick={() => setNoteMode('ABC')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                noteMode === 'ABC'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              ABC
            </button>
            <button
              onClick={() => setNoteMode('DOREMI')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                noteMode === 'DOREMI'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Do-Ré-Mi
            </button>
          </div>
        </div>

        {/* Sharp/Flat Mode */}
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-xs">Accidentals</span>
          <div className="flex rounded bg-white/10 p-0.5">
            <button
              onClick={() => setAccidentalMode('sharp')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                accidentalMode === 'sharp'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              ♯
            </button>
            <button
              onClick={() => setAccidentalMode('flat')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                accidentalMode === 'flat'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              ♭
            </button>
          </div>
        </div>
      </div>

      {/* Device Selection */}
      <div className="mb-4 space-y-2">
        <h4 className="text-xs font-medium text-white/60 uppercase tracking-wide">
          Devices
        </h4>

        {/* Microphone Selection */}
        <div>
          <label className="text-white/80 text-xs block mb-1">Microphone</label>
          <select
            value={selectedMicrophone}
            onChange={(e) => setSelectedMicrophone(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white focus:bg-white/15 focus:border-blue-500 outline-none"
          >
            <option value="" className="bg-gray-800">
              Select microphone...
            </option>
            {availableMicrophones.map((mic) => (
              <option
                key={mic.deviceId}
                value={mic.deviceId}
                className="bg-gray-800"
              >
                {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}...`}
              </option>
            ))}
          </select>
        </div>

        {/* MIDI Device Selection */}
        <div>
          <label className="text-white/80 text-xs block mb-1">
            MIDI Device
          </label>
          <select
            value={selectedMidiDevice}
            onChange={(e) => setSelectedMidiDevice(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white focus:bg-white/15 focus:border-blue-500 outline-none"
          >
            <option value="" className="bg-gray-800">
              Select MIDI device...
            </option>
            {availableMidiDevices.map((device) => (
              <option key={device.id} value={device.id} className="bg-gray-800">
                {device.name}{' '}
                {device.manufacturer && `(${device.manufacturer})`}
              </option>
            ))}
          </select>
          {availableMidiDevices.length === 0 && (
            <div className="text-xs text-white/50 mt-1">
              No MIDI devices found
            </div>
          )}
        </div>
      </div>

      {/* Add Widgets Section */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-white/60 uppercase tracking-wide mb-2">
          Widgets
        </h4>

        <div className="space-y-1">
          {availableWidgets.map((widget) => (
            <button
              key={widget.id}
              onClick={() => addWidget(widget)}
              className="w-full text-left px-2 py-2 text-white bg-white/5 hover:bg-white/15 rounded transition-colors border border-white/10 hover:border-white/20"
            >
              <div className="font-medium text-xs">{widget.title}</div>
              <div className="text-xs text-white/50">
                {widget.defaultWidth}×{widget.defaultHeight}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Management Section */}
      {widgets.length > 0 && (
        <div className="mt-auto pt-3 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/60">
              {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={clearAllWidgets}
              className="bg-red-600/80 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Render sidebar content via portal */}
      {sidebarContainer && createPortal(<SidebarContent />, sidebarContainer)}

      {/* Empty State */}
      {widgets.length === 0 && isLoaded && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white/70">
            <div className="text-6xl mb-4">🎵</div>
            <div className="text-xl mb-2">Welcome to V1brate</div>
            <div className="text-sm">
              Hover over the left edge to add widgets
            </div>
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
    </div>
  );
}
