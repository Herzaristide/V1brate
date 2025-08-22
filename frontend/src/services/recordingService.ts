import { api } from './api';
import { Recording, PaginatedResponse } from '../types';

class RecordingService {
  async uploadRecording(
    file: File,
    metadata: { title?: string; description?: string; musicalKey?: string }
  ): Promise<Recording> {
    const formData = new FormData();
    formData.append('audio', file);
    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.description)
      formData.append('description', metadata.description);
    if (metadata.musicalKey) formData.append('musicalKey', metadata.musicalKey);

    const response = await api.post<Recording>('/api/recordings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getRecordings(
    page = 1,
    limit = 20,
    search?: string,
    musicalKey?: string,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  ): Promise<PaginatedResponse<Recording>> {
    const response = await api.get<PaginatedResponse<Recording>>(
      '/api/recordings',
      {
        params: {
          page,
          limit,
          search,
          musicalKey,
          sortBy,
          sortOrder,
        },
      }
    );
    return response.data;
  }

  async getRecording(id: string): Promise<Recording> {
    const response = await api.get<Recording>(`/api/recordings/${id}`);
    return response.data;
  }

  async updateRecording(
    id: string,
    updates: { title?: string; description?: string; musicalKey?: string }
  ): Promise<Recording> {
    const response = await api.put<Recording>(`/api/recordings/${id}`, updates);
    return response.data;
  }

  async deleteRecording(id: string): Promise<void> {
    await api.delete(`/api/recordings/${id}`);
  }

  getStreamUrl(id: string): string {
    return `${api.defaults.baseURL}/api/recordings/${id}/stream`;
  }
}

export const recordingService = new RecordingService();
export default recordingService;
