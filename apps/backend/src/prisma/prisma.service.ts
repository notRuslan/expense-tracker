import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Обёртка над `PrismaClient`, привязанная к жизненному циклу Nest-приложения.
 *
 * Регистрируется в глобальном `PrismaModule`, поэтому инжектится
 * без явного импорта модуля в потребителях (например, `TransactionsService`).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /**
   * Вызывается Nest при инициализации модуля.
   * Устанавливает соединение с БД (ленивое подключение Prisma форсируется явно).
   *
   * @returns промис, резолвящийся после успешного подключения.
   * @throws если строка подключения невалидна или БД недоступна.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Вызывается Nest при остановке приложения.
   * Корректно закрывает пул соединений Prisma.
   *
   * @returns промис, резолвящийся после закрытия соединений.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
