import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { DeleteTransactionCommand } from '../contracts';
import { TransactionsService } from '../transactions.service';
import { GetUserByIdQuery } from '../../users/contracts';

/**
 * Хэндлер CQRS-команды {@link DeleteTransactionCommand}.
 * Проверяет существование пользователя и делегирует удаление сервису.
 */
@CommandHandler(DeleteTransactionCommand)
export class DeleteTransactionHandler implements ICommandHandler<DeleteTransactionCommand> {
  constructor(
    private readonly service: TransactionsService,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * @param command - команда с `id` транзакции и `userId` владельца.
   * @returns `void` после успешного удаления.
   * @throws {UnauthorizedException} если пользователь из токена не найден.
   * @throws {NotFoundException} если транзакция не найдена/чужая.
   */
  async execute(command: DeleteTransactionCommand) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(command.userId));
    if (!user) throw new UnauthorizedException();
    return this.service.delete(command.id, command.userId);
  }
}
