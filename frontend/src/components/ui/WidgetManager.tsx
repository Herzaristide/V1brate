import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Widget from './Widget';
import {
  saveWidgetLayout,
  loadWidgetLayout,
  clearWidgetLayout,
  saveWidgetSettings,
  loadWidgetSettings,
} from '../../utils/widgetStorage';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';

export interface WidgetConfig {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  defaultWidth: number;
  defaultHeight: number;
  props?: any;
  category?: 'tuning' | 'rhythm' | 'analysis' | 'practice' | 'recording';
}

export interface WidgetInstance extends WidgetConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  instanceId: string;
}

interface WidgetManagerProps {
  availableWidgets: WidgetConfig[];
  className?: string;
  isDraggable?: boolean;
  isResizable?: boolean;
}

export default function WidgetManager({
  availableWidgets,
  className,
  isDraggable = true,
  isResizable = true,
}: WidgetManagerProps) {
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarContainer, setSidebarContainer] = useState<HTMLElement | null>(
    null
  );
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [availableMicrophones, setAvailableMicrophones] = useState<
    MediaDeviceInfo[]
  >([]);
  const [availableMidiInputs, setAvailableMidiInputs] = useState<
    {
      id: string;
      name: string;
    }[]
  >([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [settings, setSettings] = useState<Record<string, any>>({});

  const { theme, setTheme } = useTheme();
  const {
    preferredKey,
    notationSystem,
    accidentalSystem,
    standartPitch,
    setPreferredKey,
    setNotationSystem,
    setAccidentalSystem,
    setStandartPitch,
  } = useUserPreferences();

  // Load saved layout and settings on mount
  useEffect(() => {
    const savedWidgets = loadWidgetLayout();
    const savedSettings = loadWidgetSettings();

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
              instanceId: savedWidget.instanceId || savedWidget.id,
              x: savedWidget.x,
              y: savedWidget.y,
              width: savedWidget.width,
              height: savedWidget.height,
            };
          }
          return null;
        })
        .filter(Boolean) as WidgetInstance[];

      setWidgets(restoredWidgets);
    }

    setSettings(savedSettings);
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

        if (microphones.length > 0 && !selectedMicrophone) {
          setSelectedMicrophone(microphones[0].deviceId);
        }
      } catch (error) {
        console.error('Error accessing microphones:', error);
      }
    };

    getMicrophones();
  }, [selectedMicrophone]);

  // Get available MIDI inputs
  useEffect(() => {
    const initMidi = async () => {
      try {
        if ((navigator as any).requestMIDIAccess) {
          const midiAccess = await (navigator as any).requestMIDIAccess();
          const inputs = Array.from(midiAccess.inputs.values()).map(
            (i: any) => ({
              id: i.id,
              name: i.name,
            })
          );
          setAvailableMidiInputs(inputs);

          midiAccess.onstatechange = () => {
            const updated = Array.from(midiAccess.inputs.values()).map(
              (i: any) => ({
                id: i.id,
                name: i.name,
              })
            );
            setAvailableMidiInputs(updated);
          };
        }
      } catch (error) {
        // ignore if MIDI not supported
      }
    };

    initMidi();
  }, []);

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

  // Save settings when they change
  useEffect(() => {
    if (isLoaded) {
      saveWidgetSettings(settings);
    }
  }, [settings, isLoaded]);

  // Add widget
  const addWidget = useCallback((widgetConfig: WidgetConfig) => {
    const instanceId = `${widgetConfig.id}-${Date.now()}`;
    const newWidget: WidgetInstance = {
      ...widgetConfig,
      instanceId,
      x: Math.random() * 300, // Random initial position
      y: Math.random() * 200,
      width: widgetConfig.defaultWidth,
      height: widgetConfig.defaultHeight,
    };
    setWidgets((prev) => [...prev, newWidget]);
    setShowAddMenu(false);
  }, []);

  // Move widget
  const moveWidget = useCallback((instanceId: string, x: number, y: number) => {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.instanceId === instanceId ? { ...widget, x, y } : widget
      )
    );
  }, []);

  // Resize widget
  const resizeWidget = useCallback(
    (instanceId: string, width: number, height: number) => {
      setWidgets((prev) =>
        prev.map((widget) =>
          widget.instanceId === instanceId
            ? { ...widget, width, height }
            : widget
        )
      );
    },
    []
  );

  // Remove widget
  const removeWidget = useCallback((instanceId: string) => {
    setWidgets((prev) =>
      prev.filter((widget) => widget.instanceId !== instanceId)
    );
  }, []);

  // Clear all widgets
  const clearAllWidgets = useCallback(() => {
    setWidgets([]);
    clearWidgetLayout();
  }, []);

  // Update setting
  const updateSetting = useCallback((key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Sidebar content component
  const SidebarContent = () => (
    <div className='flex flex-col h-full text-sm'>
      {/* Global Settings */}
      <div className='mb-4 space-y-3'>
        <h4 className='text-xs font-medium text-white/60 uppercase tracking-wide'>
          Global Settings
        </h4>

        {/* Theme Toggle */}
        <div className='flex items-center justify-between'>
          <span className='text-white/80 text-xs'>Theme</span>
          <div className='flex rounded bg-white/10 p-0.5'>
            <button
              onClick={() => setTheme('light')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                theme === 'light'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                theme === 'dark'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                theme === 'system'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Auto
            </button>
          </div>
        </div>

        {/* Notation System */}
        <div className='flex items-center justify-between'>
          <span className='text-white/80 text-xs'>Notation</span>
          <div className='flex rounded bg-white/10 p-0.5'>
            <button
              onClick={() => setNotationSystem('ABC')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                notationSystem === 'ABC'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              ABC
            </button>
            <button
              onClick={() => setNotationSystem('DoReMi')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                notationSystem === 'DoReMi'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Do-Ré-Mi
            </button>
          </div>
        </div>

        {/* Accidental System */}
        <div className='flex items-center justify-between'>
          <span className='text-white/80 text-xs'>Accidentals</span>
          <div className='flex rounded bg-white/10 p-0.5'>
            <button
              onClick={() => setAccidentalSystem('sharp')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                accidentalSystem === 'sharp'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Sharp
            </button>
            <button
              onClick={() => setAccidentalSystem('flat')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                accidentalSystem === 'flat'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Flat
            </button>
          </div>
        </div>

        {/* Standard Pitch */}
        <div className='space-y-1'>
          <div className='flex items-center justify-between'>
            <span className='text-white/80 text-xs'>Standard Pitch</span>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                min={415}
                max={466}
                step={0.1}
                value={standartPitch}
                onChange={(e) => setStandartPitch(Number(e.target.value))}
                onBlur={(e) => {
                  const v = Number(e.target.value) || 440;
                  const clamped = Math.min(466, Math.max(415, v));
                  if (clamped !== standartPitch) setStandartPitch(clamped);
                }}
                aria-label='Standard pitch (Hz)'
                className='w-20 bg-white/10 border border-white/20 rounded px-2 py-0.5 text-xs text-white focus:outline-none'
              />
              <span className='text-white/60 text-xs'>{standartPitch} Hz</span>
            </div>
          </div>
          <div className='space-y-1'>
            <div className='text-xs text-white/40'>
              Enter A4 reference pitch (Hz). Range 415–466.
            </div>
            <div className='flex gap-1'>
              <button
                onClick={() => setStandartPitch(415)}
                className='flex-1 px-1 py-0.5 text-xs rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 transition-colors'
              >
                Baroque
              </button>
              <button
                onClick={() => setStandartPitch(440)}
                className='flex-1 px-1 py-0.5 text-xs rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 transition-colors'
              >
                Standard
              </button>
              <button
                onClick={() => setStandartPitch(442)}
                className='flex-1 px-1 py-0.5 text-xs rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 transition-colors'
              >
                Classical
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Device Selection */}
      <div className='mb-4 space-y-2'>
        <h4 className='text-xs font-medium text-white/60 uppercase tracking-wide'>
          Audio Input
        </h4>

        <div>
          <label className='text-white/80 text-xs block mb-1'>Microphone</label>
          <select
            value={selectedMicrophone}
            onChange={(e) => setSelectedMicrophone(e.target.value)}
            className='w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white focus:bg-white/15 focus:border-blue-500 outline-none'
          >
            <option value='' className='bg-gray-800'>
              Select microphone...
            </option>
            {availableMicrophones.map((mic) => (
              <option
                key={mic.deviceId}
                value={mic.deviceId}
                className='bg-gray-800'
              >
                {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}...`}
              </option>
            ))}
          </select>
        </div>

        {/* MIDI Input */}
        <div className='mt-3'>
          <label className='text-white/80 text-xs block mb-1'>MIDI Input</label>
          <select
            value={settings.selectedMidiInput || ''}
            onChange={(e) => {
              const val = e.target.value;
              setSettings((s) => ({ ...s, selectedMidiInput: val }));
            }}
            className='w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white outline-none'
          >
            <option value=''>No MIDI Input</option>
            {availableMidiInputs.map((m) => (
              <option key={m.id} value={m.id} className='bg-gray-800'>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Available Widgets */}
      <div className='mb-4'>
        <h4 className='text-xs font-medium text-white/60 uppercase tracking-wide mb-2'>
          Add Widgets
        </h4>

        <div className='space-y-1'>
          {availableWidgets.map((widget) => (
            <button
              key={widget.id}
              onClick={() => addWidget(widget)}
              className='w-full text-left px-2 py-2 text-white bg-white/5 hover:bg-white/15 rounded transition-colors border border-white/10 hover:border-white/20'
            >
              <div className='font-medium text-xs'>{widget.title}</div>
              <div className='text-xs text-white/50'>
                {widget.defaultWidth}×{widget.defaultHeight}
                {widget.category && ` • ${widget.category}`}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Widget Management */}
      {widgets.length > 0 && (
        <div className='mt-auto pt-3 border-t border-white/10'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-xs text-white/60'>
              {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={clearAllWidgets}
              className='bg-red-600/80 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors'
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
        <div className='flex items-center justify-center h-full'>
          <div className='text-center text-white/70'>
            <div className='text-6xl mb-4'>🎵</div>
            <div className='text-xl mb-2'>Welcome to V1brate</div>
            <div className='text-sm'>
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
            key={widget.instanceId}
            id={widget.instanceId}
            title={widget.title}
            x={widget.x}
            y={widget.y}
            width={widget.width}
            height={widget.height}
            onMove={moveWidget}
            onResize={resizeWidget}
            onClose={removeWidget}
            isDraggable={isDraggable}
            isResizable={isResizable}
          >
            <Component
              {...(widget.props || {})}
              selectedMicrophone={selectedMicrophone}
              settings={settings}
              updateSetting={updateSetting}
              preferredKey={preferredKey}
              notationSystem={notationSystem}
            />
          </Widget>
        );
      })}
    </div>
  );
}
