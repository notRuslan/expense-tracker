import type { UpdateTransactionDto } from '@expense-tracker/shared';

/**
 * CQRS-команда частичного обновления транзакции.
 * Обрабатывается {@link UpdateTransactionHandler}.
 * Все поля DTO опциональны — обновляются только переданные.
 */
export class UpdateTransactionCommand {
  /**
   * @param id - идентификатор обновляемой транзакции.
   * @param userId - идентификатор владельца (для проверки прав доступа).
   * @param dto - частичный набор полей для обновления.
   */
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly dto: UpdateTransactionDto,
  ) {}
}
