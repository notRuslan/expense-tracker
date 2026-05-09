import { ExecutionContext, createParamDecorator } from '@nestjs/common';

/**
 * Полезная нагрузка JWT, кладётся в `request.user` стратегией `JwtStrategy`
 * после успешной валидации токена.
 */
export interface JwtUser {
  /** Идентификатор пользователя (`User.id` из Prisma). */
  userId: string;
  /** Email пользователя из токена. */
  email: string;
}

/**
 * Параметрический декоратор, извлекающий {@link JwtUser} из текущего HTTP-запроса.
 *
 * Используется в защищённых контроллерах в связке с {@link JwtAuthGuard}:
 * `userId` берётся отсюда, а не из тела/query — иначе клиент мог бы
 * подменить владельца ресурса.
 *
 * @returns объект {@link JwtUser} из `request.user`.
 *   Если эндпоинт не защищён `JwtAuthGuard`, значение будет `undefined`.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtUser;
  },
);
