import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CreateTransactionHandler } from './commands/create-transaction.handler';
import { UpdateTransactionHandler } from './commands/update-transaction.handler';
import { DeleteTransactionHandler } from './commands/delete-transaction.handler';
import { GetTransactionsHandler } from './queries/get-transactions.handler';
import { GetTransactionByIdHandler } from './queries/get-transaction-by-id.handler';

/**
 * Доменный модуль «Транзакции».
 *
 * Регистрирует контроллер `/transactions`, фасад-сервис
 * и все CQRS-хэндлеры (без явной регистрации в `providers`
 * `@nestjs/cqrs` их не обнаружит).
 *
 * Зависимости:
 * - `CqrsModule` — `CommandBus` и `QueryBus`.
 * - `AuthModule` — `JwtAuthGuard` и стратегия JWT.
 * - `UsersModule` — `GetUserByIdQuery` для проверки существования пользователя в хэндлерах команд.
 *
 * `PrismaService` доступен через глобальный `PrismaModule`.
 */
@Module({
  imports: [CqrsModule, AuthModule, UsersModule],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    CreateTransactionHandler,
    UpdateTransactionHandler,
    DeleteTransactionHandler,
    GetTransactionsHandler,
    GetTransactionByIdHandler,
  ],
})
export class TransactionsModule {}
