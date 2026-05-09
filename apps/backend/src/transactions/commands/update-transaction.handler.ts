import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { UpdateTransactionCommand } from '../contracts';
import { TransactionsService } from '../transactions.service';
import { GetUserByIdQuery } from '../../users/contracts';

/**
 * Хэндлер CQRS-команды {@link UpdateTransactionCommand}.
 * Проверяет существование пользователя и делегирует обновление сервису.
 */
@CommandHandler(UpdateTransactionCommand)
export class UpdateTransactionHandler implements ICommandHandler<UpdateTransactionCommand> {
  constructor(
    private readonly service: TransactionsService,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * @param command - команда с `id`, `userId` и `dto`.
   * @returns обновлённую транзакцию (см. {@link TransactionsService.update}).
   * @throws {UnauthorizedException} если пользователь из токена не найден.
   * @throws {NotFoundException} если транзакция не найдена/чужая
   *   или указана чужая `categoryId`.
   */
  async execute(command: UpdateTransactionCommand) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(command.userId));
    if (!user) throw new UnauthorizedException();
    return this.service.update(command.id, command.userId, command.dto);
  }
}
