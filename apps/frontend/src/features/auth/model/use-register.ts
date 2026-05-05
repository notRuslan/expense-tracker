'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RegisterDto } from '@expense-tracker/shared';
import { setSession } from '@/entities/session';
import { ApiError } from '@/shared/api/client';
import { authApi } from '../api/auth-api';

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const register = async (dto: RegisterDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authApi.register(dto);
      setSession(data);
      router.push('/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading, error };
}
