'use client';

import { useEffect, useState } from 'react';
import type { TransactionsListResponse } from '@expense-tracker/shared';
import { getToken } from '@/entities/session';
import { ApiError } from '@/shared/api/client';
import { getRecentTransactions } from '../api/recent-transactions-api';

const LIMIT = 10;

export function useRecentTransactions(refreshKey = 0) {
  const [data, setData] = useState<TransactionsListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('Нет токена авторизации');
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getRecentTransactions(page, LIMIT, token)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить транзакции');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, refreshKey]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return { data, page, setPage, totalPages, isLoading, error, limit: LIMIT };
}
