import { useQuery, useMutation, useQueryClient } from 'react-query';
import { subscriptionService } from '../services/subscriptionService';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';

export function useSubscription() {
  const { isAuthenticated } = useAuth();

  return useQuery(
    ['subscription'],
    () => subscriptionService.getSubscription(),
    {
      enabled: isAuthenticated,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function useSubscriptionUsage() {
  const { isAuthenticated } = useAuth();

  return useQuery(
    ['subscription', 'usage'],
    () => subscriptionService.getSubscriptionUsage(),
    {
      enabled: isAuthenticated,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

export function useSubscriptionPlans() {
  return useQuery(
    ['subscription', 'plans'],
    () => subscriptionService.getSubscriptionPlans(),
    {
      staleTime: 30 * 60 * 1000, // 30 minutes
    }
  );
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation(
    (data: Parameters<typeof subscriptionService.updateSubscription>[0]) =>
      subscriptionService.updateSubscription(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['subscription']);
      },
    }
  );
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation(() => subscriptionService.cancelSubscription(), {
    onSuccess: () => {
      queryClient.invalidateQueries(['subscription']);
    },
  });
}

export function usePayments(page = 1, limit = 20, status?: string) {
  const { isAuthenticated } = useAuth();

  return useQuery(
    ['payments', page, limit, status],
    () => paymentService.getPayments(page, limit, status),
    {
      enabled: isAuthenticated,
      keepPreviousData: true,
    }
  );
}

export function usePaymentStats() {
  const { isAuthenticated } = useAuth();

  return useQuery(
    ['payments', 'stats'],
    () => paymentService.getPaymentStats(),
    {
      enabled: isAuthenticated,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function useCreatePaymentIntent() {
  return useMutation(
    (data: Parameters<typeof paymentService.createPaymentIntent>[0]) =>
      paymentService.createPaymentIntent(data)
  );
}
