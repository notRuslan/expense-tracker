import type { CreateTransactionDto, Transaction } from '@expense-tracker/shared';
import { apiRequest } from '@/shared/api/client';

export function createTransaction(
  dto: CreateTransactionDto,
  token: string,
): Promise<Transaction> {
  return apiRequest<Transaction>(
    '/transactions',
    {
      method: 'POST',
      body: JSON.stringify(dto),
    },
    token,
  );
}
