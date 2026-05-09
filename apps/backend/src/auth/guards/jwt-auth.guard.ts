import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard для эндпоинтов, требующих валидный JWT в заголовке `Authorization`.
 *
 * Делегирует проверку `passport-jwt`-стратегии (`JwtStrategy`):
 * при успехе кладёт `JwtUser` в `request.user` (откуда его читает
 * декоратор {@link CurrentUser}); при отсутствии/невалидном токене
 * Passport бросает `UnauthorizedException`.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
