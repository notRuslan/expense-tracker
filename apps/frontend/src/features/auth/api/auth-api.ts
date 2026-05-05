import type { AuthResponse, LoginDto, RegisterDto } from '@expense-tracker/shared';
import { apiRequest } from '@/shared/api/client';

export const authApi = {
  login: (dto: LoginDto) =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  register: (dto: RegisterDto) =>
    apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
};
