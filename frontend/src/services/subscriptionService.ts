import { api } from './api';
import { Subscription, SubscriptionUsage, SubscriptionPlan } from '../types';

interface UpdateSubscriptionData {
  tier: 'free' | 'premium' | 'pro';
  externalId?: string;
  externalCustomerId?: string;
}

class SubscriptionService {
  async getSubscription(): Promise<Subscription> {
    const response = await api.get<Subscription>('/api/subscriptions/me');
    return response.data;
  }

  async getSubscriptionUsage(): Promise<SubscriptionUsage> {
    const response = await api.get<SubscriptionUsage>(
      '/api/subscriptions/me/usage'
    );
    return response.data;
  }

  async updateSubscription(
    data: UpdateSubscriptionData
  ): Promise<Subscription> {
    const response = await api.put<Subscription>('/api/subscriptions/me', data);
    return response.data;
  }

  async cancelSubscription(): Promise<{
    message: string;
    subscription: Subscription;
  }> {
    const response = await api.post('/api/subscriptions/me/cancel');
    return response.data;
  }

  async reactivateSubscription(): Promise<{
    message: string;
    subscription: Subscription;
  }> {
    const response = await api.post('/api/subscriptions/me/reactivate');
    return response.data;
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const response = await api.get<SubscriptionPlan[]>(
      '/api/subscriptions/plans'
    );
    return response.data;
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
