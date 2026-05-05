'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LoginDto } from '@expense-tracker/shared';
import { setSession } from '@/entities/session';
import { ApiError } from '@/shared/api/client';
import { authApi } from '../api/auth-api';

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const login = async (dto: LoginDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authApi.login(dto);
      setSession(data);
      router.push('/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
}
