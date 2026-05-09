/**
 * CQRS-команда удаления транзакции.
 * Обрабатывается {@link DeleteTransactionHandler}.
 */
export class DeleteTransactionCommand {
  /**
   * @param id - идентификатор удаляемой транзакции.
   * @param userId - идентификатор владельца (для проверки прав доступа).
   */
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
