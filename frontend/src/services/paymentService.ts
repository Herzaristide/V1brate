import { api } from './api';
import { Payment, PaginatedResponse } from '../types';

interface CreatePaymentIntentData {
  amount: number;
  currency: string;
  description?: string;
  subscriptionId: string;
}

interface PaymentIntentResponse {
  paymentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

interface PaymentStats {
  totalPayments: number;
  totalPaid: number;
  statusBreakdown: Record<string, { count: number; total: number }>;
  lastPayment?: {
    id: string;
    amount: number;
    currency: string;
    paidAt?: string;
    description?: string;
  };
}

class PaymentService {
  async getPayments(
    page = 1,
    limit = 20,
    status?: string
  ): Promise<PaginatedResponse<Payment>> {
    const response = await api.get<PaginatedResponse<Payment>>(
      '/api/payments',
      {
        params: { page, limit, status },
      }
    );
    return response.data;
  }

  async getPayment(id: string): Promise<Payment> {
    const response = await api.get<Payment>(`/api/payments/${id}`);
    return response.data;
  }

  async createPaymentIntent(
    data: CreatePaymentIntentData
  ): Promise<PaymentIntentResponse> {
    const response = await api.post<PaymentIntentResponse>(
      '/api/payments/intent',
      data
    );
    return response.data;
  }

  async confirmPayment(
    id: string
  ): Promise<{ message: string; payment: Payment }> {
    const response = await api.post(`/api/payments/${id}/confirm`);
    return response.data;
  }

  async cancelPayment(
    id: string
  ): Promise<{ message: string; payment: Payment }> {
    const response = await api.post(`/api/payments/${id}/cancel`);
    return response.data;
  }

  async requestRefund(
    id: string,
    reason?: string
  ): Promise<{ message: string; payment: Payment }> {
    const response = await api.post(`/api/payments/${id}/refund`, { reason });
    return response.data;
  }

  async getPaymentStats(): Promise<PaymentStats> {
    const response = await api.get<PaymentStats>('/api/payments/stats/summary');
    return response.data;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
