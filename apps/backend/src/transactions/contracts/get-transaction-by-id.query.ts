/**
 * CQRS-запрос получения одной транзакции по идентификатору.
 * Обрабатывается {@link GetTransactionByIdHandler}.
 */
export class GetTransactionByIdQuery {
  /**
   * @param id - идентификатор запрашиваемой транзакции.
   * @param userId - идентификатор владельца (для фильтрации чужих данных).
   */
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
