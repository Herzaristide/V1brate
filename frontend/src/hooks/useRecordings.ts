import { useQuery, useMutation, useQueryClient } from 'react-query';
import { recordingService } from '../services/recordingService';
import { useAuth } from '../contexts/AuthContext';

export function useRecordings(
  page = 1,
  limit = 20,
  search?: string,
  musicalKey?: string,
  sortBy = 'createdAt',
  sortOrder = 'desc'
) {
  const { isAuthenticated } = useAuth();

  return useQuery(
    ['recordings', page, limit, search, musicalKey, sortBy, sortOrder],
    () =>
      recordingService.getRecordings(
        page,
        limit,
        search,
        musicalKey,
        sortBy,
        sortOrder
      ),
    {
      enabled: isAuthenticated,
      keepPreviousData: true,
    }
  );
}

export function useRecording(id: string) {
  const { isAuthenticated } = useAuth();

  return useQuery(['recording', id], () => recordingService.getRecording(id), {
    enabled: isAuthenticated && !!id,
  });
}

export function useUploadRecording() {
  const queryClient = useQueryClient();

  return useMutation(
    ({
      file,
      metadata,
    }: {
      file: File;
      metadata: { title?: string; description?: string; musicalKey?: string };
    }) => recordingService.uploadRecording(file, metadata),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['recordings']);
      },
    }
  );
}

export function useUpdateRecording() {
  const queryClient = useQueryClient();

  return useMutation(
    ({
      id,
      updates,
    }: {
      id: string;
      updates: { title?: string; description?: string; musicalKey?: string };
    }) => recordingService.updateRecording(id, updates),
    {
      onSuccess: (_, { id }) => {
        queryClient.invalidateQueries(['recording', id]);
        queryClient.invalidateQueries(['recordings']);
      },
    }
  );
}

export function useDeleteRecording() {
  const queryClient = useQueryClient();

  return useMutation((id: string) => recordingService.deleteRecording(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(['recordings']);
    },
  });
}
