import React, { createContext, useContext, useState, useEffect } from 'react';
import { WidgetConfig, WidgetPreset } from '../types';
import { widgetService } from '../services/widgetService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface WidgetContextType {
  widgets: WidgetConfig[];
  presets: WidgetPreset[];
  isLoading: boolean;
  error: string | null;

  // Widget operations
  addWidget: (
    widget: Omit<WidgetConfig, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => Promise<void>;
  removeWidget: (id: string) => Promise<void>;

  // Preset operations
  loadPresets: () => Promise<void>;
  applyPreset: (presetId: string, clearExisting?: boolean) => Promise<void>;
  savePreset: (
    name: string,
    description?: string,
    isPublic?: boolean
  ) => Promise<void>;

  // Layout operations
  saveLayout: (widgets: WidgetConfig[]) => Promise<void>;
  refreshWidgets: () => Promise<void>;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [presets, setPresets] = useState<WidgetPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load widgets when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshWidgets();
      loadPresets();
    } else {
      setWidgets([]);
      setPresets([]);
    }
  }, [isAuthenticated]);

  const refreshWidgets = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const widgetConfigs = await widgetService.getWidgetConfigs();
      setWidgets(widgetConfigs);
      setError(null);
    } catch (error: any) {
      setError('Failed to load widgets');
      console.error('Error loading widgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addWidget = async (
    widgetData: Omit<WidgetConfig, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!isAuthenticated) return;

    try {
      const newWidget = await widgetService.createWidgetConfig({
        widgetType: widgetData.widgetType,
        instanceId: widgetData.instanceId,
        x: widgetData.x,
        y: widgetData.y,
        width: widgetData.width,
        height: widgetData.height,
        settings: widgetData.settings,
        musicalKey: widgetData.musicalKey,
        isPremiumFeature: widgetData.isPremiumFeature,
        zIndex: widgetData.zIndex,
      });

      setWidgets((prev) => [...prev, newWidget]);
      toast.success('Widget added successfully');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to add widget';
      toast.error(message);
      throw error;
    }
  };

  const updateWidget = async (id: string, updates: Partial<WidgetConfig>) => {
    if (!isAuthenticated) return;

    try {
      const updatedWidget = await widgetService.updateWidgetConfig(id, updates);
      setWidgets((prev) => prev.map((w) => (w.id === id ? updatedWidget : w)));
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update widget';
      toast.error(message);
      throw error;
    }
  };

  const removeWidget = async (id: string) => {
    if (!isAuthenticated) return;

    try {
      await widgetService.deleteWidgetConfig(id);
      setWidgets((prev) => prev.filter((w) => w.id !== id));
      toast.success('Widget removed successfully');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to remove widget';
      toast.error(message);
      throw error;
    }
  };

  const loadPresets = async () => {
    if (!isAuthenticated) return;

    try {
      const presetList = await widgetService.getWidgetPresets(true);
      setPresets(presetList);
    } catch (error: any) {
      console.error('Error loading presets:', error);
    }
  };

  const applyPreset = async (presetId: string, clearExisting = false) => {
    if (!isAuthenticated) return;

    try {
      const result = await widgetService.applyWidgetPreset(
        presetId,
        clearExisting
      );
      await refreshWidgets(); // Reload all widgets
      toast.success(`Applied preset with ${result.configsCreated} widgets`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to apply preset';
      toast.error(message);
      throw error;
    }
  };

  const savePreset = async (
    name: string,
    description?: string,
    isPublic = false
  ) => {
    if (!isAuthenticated || widgets.length === 0) return;

    try {
      const widgetConfigs = widgets.map((widget) => ({
        widgetType: widget.widgetType,
        x: widget.x,
        y: widget.y,
        width: widget.width,
        height: widget.height,
        settings: widget.settings,
        musicalKey: widget.musicalKey,
        isPremiumFeature: widget.isPremiumFeature,
        zIndex: widget.zIndex,
      }));

      const newPreset = await widgetService.createWidgetPreset({
        name,
        description,
        widgetConfigs,
        isPublic,
      });

      setPresets((prev) => [...prev, newPreset]);
      toast.success('Preset saved successfully');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to save preset';
      toast.error(message);
      throw error;
    }
  };

  const saveLayout = async (updatedWidgets: WidgetConfig[]) => {
    if (!isAuthenticated) return;

    try {
      // Update each widget's position and size
      const updatePromises = updatedWidgets.map((widget) =>
        widgetService.updateWidgetConfig(widget.id, {
          x: widget.x,
          y: widget.y,
          width: widget.width,
          height: widget.height,
          zIndex: widget.zIndex,
        })
      );

      await Promise.all(updatePromises);
      setWidgets(updatedWidgets);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to save layout';
      toast.error(message);
      throw error;
    }
  };

  const value: WidgetContextType = {
    widgets,
    presets,
    isLoading,
    error,
    addWidget,
    updateWidget,
    removeWidget,
    loadPresets,
    applyPreset,
    savePreset,
    saveLayout,
    refreshWidgets,
  };

  return (
    <WidgetContext.Provider value={value}>{children}</WidgetContext.Provider>
  );
}

export function useWidgets() {
  const context = useContext(WidgetContext);
  if (context === undefined) {
    throw new Error('useWidgets must be used within a WidgetProvider');
  }
  return context;
}
