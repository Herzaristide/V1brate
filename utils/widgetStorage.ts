'use client';

import { WidgetInstance } from '../ui/WidgetManager';

const STORAGE_KEY = 'v1brate-widgets';

export const saveWidgetLayout = (widgets: WidgetInstance[]): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch (error) {
      console.error('Failed to save widget layout:', error);
    }
  }
};

export const loadWidgetLayout = (): WidgetInstance[] => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load widget layout:', error);
      return [];
    }
  }
  return [];
};

export const clearWidgetLayout = (): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear widget layout:', error);
    }
  }
};
