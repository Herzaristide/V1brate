import { api } from './api';
import { PitchAnalysis, PaginatedResponse, Note, PitchPoint } from '../types';

interface CreatePitchAnalysisData {
  pitchData: PitchPoint[];
  analysisType: 'realtime' | 'recording' | 'batch';
  musicalKey?: string;
  notationSystem?: 'ABC' | 'DoReMi';
  bufferSize?: number;
  sampleRate?: number;
  algorithm?: string;
  windowFunction?: string;
  recordingId?: string;
}

class PitchAnalysisService {
  async createAnalysis(data: CreatePitchAnalysisData): Promise<PitchAnalysis> {
    const response = await api.post<PitchAnalysis>('/api/pitch-analysis', data);
    return response.data;
  }

  async getAnalyses(
    page = 1,
    limit = 20,
    recordingId?: string,
    analysisType?: string,
    musicalKey?: string
  ): Promise<PaginatedResponse<PitchAnalysis>> {
    const response = await api.get<PaginatedResponse<PitchAnalysis>>(
      '/api/pitch-analysis',
      {
        params: { page, limit, recordingId, analysisType, musicalKey },
      }
    );
    return response.data;
  }

  async getAnalysis(id: string): Promise<PitchAnalysis> {
    const response = await api.get<PitchAnalysis>(`/api/pitch-analysis/${id}`);
    return response.data;
  }

  async updateAnalysis(
    id: string,
    updates: { musicalKey?: string; notationSystem?: 'ABC' | 'DoReMi' }
  ): Promise<PitchAnalysis> {
    const response = await api.put<PitchAnalysis>(
      `/api/pitch-analysis/${id}`,
      updates
    );
    return response.data;
  }

  async deleteAnalysis(id: string): Promise<void> {
    await api.delete(`/api/pitch-analysis/${id}`);
  }

  async addNote(
    analysisId: string,
    note: { time?: number; text: string }
  ): Promise<Note> {
    const response = await api.post<Note>(
      `/api/pitch-analysis/${analysisId}/notes`,
      note
    );
    return response.data;
  }

  async getAnalysisStats(id: string): Promise<{
    totalDataPoints: number;
    confidence?: number;
    musicalKey?: string;
    frequencyRange?: {
      min: number;
      max: number;
      average: number;
    };
    noteDistribution: Record<string, number>;
  }> {
    const response = await api.get(`/api/pitch-analysis/${id}/stats`);
    return response.data;
  }
}

export const pitchAnalysisService = new PitchAnalysisService();
export default pitchAnalysisService;
