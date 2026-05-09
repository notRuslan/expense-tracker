import type { CreateTransactionDto } from '@expense-tracker/shared';

/**
 * CQRS-команда создания транзакции для конкретного пользователя.
 * Обрабатывается {@link CreateTransactionHandler} через `CommandBus`.
 */
export class CreateTransactionCommand {
  /**
   * @param userId - идентификатор владельца транзакции (из JWT, не из тела запроса).
   * @param dto - валидированные данные транзакции (сумма, тип, дата, категория и т.п.).
   */
  constructor(
    public readonly userId: string,
    public readonly dto: CreateTransactionDto,
  ) {}
}
