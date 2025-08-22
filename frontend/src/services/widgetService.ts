import { api } from './api';
import { WidgetConfig, WidgetPreset, PaginatedResponse } from '../types';

interface CreateWidgetConfigData {
  widgetType: WidgetConfig['widgetType'];
  instanceId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  settings?: any;
  musicalKey?: string;
  isPremiumFeature?: boolean;
  zIndex?: number;
}

interface UpdateWidgetConfigData {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  settings?: any;
  musicalKey?: string;
  isVisible?: boolean;
  isMinimized?: boolean;
  zIndex?: number;
}

interface CreateWidgetPresetData {
  name: string;
  description?: string;
  widgetConfigs: any[];
  tags?: string[];
  isPublic?: boolean;
}

class WidgetService {
  // Widget Configurations
  async getWidgetConfigs(): Promise<WidgetConfig[]> {
    const response = await api.get<WidgetConfig[]>('/api/widgets/configs');
    return response.data;
  }

  async createWidgetConfig(
    data: CreateWidgetConfigData
  ): Promise<WidgetConfig> {
    const response = await api.post<WidgetConfig>('/api/widgets/configs', data);
    return response.data;
  }

  async updateWidgetConfig(
    id: string,
    data: UpdateWidgetConfigData
  ): Promise<WidgetConfig> {
    const response = await api.put<WidgetConfig>(
      `/api/widgets/configs/${id}`,
      data
    );
    return response.data;
  }

  async deleteWidgetConfig(id: string): Promise<void> {
    await api.delete(`/api/widgets/configs/${id}`);
  }

  // Widget Presets
  async getWidgetPresets(includePublic = false): Promise<WidgetPreset[]> {
    const response = await api.get<WidgetPreset[]>('/api/widgets/presets', {
      params: { includePublic },
    });
    return response.data;
  }

  async getWidgetPreset(id: string): Promise<WidgetPreset> {
    const response = await api.get<WidgetPreset>(`/api/widgets/presets/${id}`);
    return response.data;
  }

  async createWidgetPreset(
    data: CreateWidgetPresetData
  ): Promise<WidgetPreset> {
    const response = await api.post<WidgetPreset>('/api/widgets/presets', data);
    return response.data;
  }

  async updateWidgetPreset(
    id: string,
    data: Partial<CreateWidgetPresetData>
  ): Promise<WidgetPreset> {
    const response = await api.put<WidgetPreset>(
      `/api/widgets/presets/${id}`,
      data
    );
    return response.data;
  }

  async deleteWidgetPreset(id: string): Promise<void> {
    await api.delete(`/api/widgets/presets/${id}`);
  }

  async applyWidgetPreset(
    id: string,
    clearExisting = false
  ): Promise<{
    message: string;
    configsCreated: number;
    configs: WidgetConfig[];
  }> {
    const response = await api.post(`/api/widgets/presets/${id}/apply`, null, {
      params: { clearExisting },
    });
    return response.data;
  }
}

export const widgetService = new WidgetService();
export default widgetService;
