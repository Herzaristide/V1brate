import { useQuery, useMutation, useQueryClient } from 'react-query';
import { userService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

export function useUserStats() {
  const { isAuthenticated } = useAuth();

  return useQuery(['user', 'stats'], () => userService.getUserStats(), {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserActivities(page = 1, limit = 20) {
  const { isAuthenticated } = useAuth();

  return useQuery(
    ['user', 'activities', page, limit],
    () => userService.getUserActivities(page, limit),
    {
      enabled: isAuthenticated,
      keepPreviousData: true,
    }
  );
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  return useMutation(
    (data: Parameters<typeof userService.updateProfile>[0]) =>
      userService.updateProfile(data),
    {
      onSuccess: (updatedUser) => {
        updateUser(updatedUser);
        queryClient.invalidateQueries(['user']);
      },
    }
  );
}
