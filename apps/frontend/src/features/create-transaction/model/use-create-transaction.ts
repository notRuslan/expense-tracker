'use client';

import { useState } from 'react';
import type { CreateTransactionDto, Transaction } from '@expense-tracker/shared';
import { getToken } from '@/entities/session';
import { ApiError } from '@/shared/api/client';
import { createTransaction } from '../api/create-transaction-api';

export function useCreateTransaction(onSuccess?: (tx: Transaction) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (dto: CreateTransactionDto) => {
    const token = getToken();
    if (!token) {
      setError('Нет токена авторизации');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const tx = await createTransaction(dto, token);
      onSuccess?.(tx);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось создать транзакцию');
    } finally {
      setIsLoading(false);
    }
  };

  return { submit, isLoading, error };
}
