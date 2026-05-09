import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { CreateTransactionCommand } from '../contracts';
import { TransactionsService } from '../transactions.service';
import { GetUserByIdQuery } from '../../users/contracts';

/**
 * Хэндлер CQRS-команды {@link CreateTransactionCommand}.
 *
 * Перед делегированием в сервис проверяет, что пользователь из JWT
 * всё ещё существует в БД (защита от валидного, но «осиротевшего» токена
 * после удаления учётной записи).
 */
@CommandHandler(CreateTransactionCommand)
export class CreateTransactionHandler implements ICommandHandler<CreateTransactionCommand> {
  constructor(
    private readonly service: TransactionsService,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * @param command - команда с `userId` и валидированным `dto`.
   * @returns созданную транзакцию (см. {@link TransactionsService.create}).
   * @throws {UnauthorizedException} если пользователь из токена не найден в БД.
   * @throws {NotFoundException} если в `dto.categoryId` указана чужая/несуществующая категория.
   */
  async execute(command: CreateTransactionCommand) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(command.userId));
    if (!user) throw new UnauthorizedException();
    return this.service.create(command.userId, command.dto);
  }
}
