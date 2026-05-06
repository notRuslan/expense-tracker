import type { TransactionsListResponse } from '@expense-tracker/shared';
import { apiRequest } from '@/shared/api/client';

export function getRecentTransactions(
  page: number,
  limit: number,
  token: string,
): Promise<TransactionsListResponse> {
  return apiRequest<TransactionsListResponse>(
    `/transactions?page=${page}&limit=${limit}`,
    { method: 'GET' },
    token,
  );
}
