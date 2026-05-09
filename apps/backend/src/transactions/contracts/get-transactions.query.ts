/**
 * CQRS-запрос списка транзакций пользователя с опциональной фильтрацией по периоду.
 * Обрабатывается {@link GetTransactionsHandler}.
 *
 * Семантика фильтра:
 * - оба параметра не заданы — все транзакции пользователя;
 * - задан только `year` — все транзакции за указанный год;
 * - заданы `month` и `year` — транзакции за указанный месяц этого года.
 */
export class GetTransactionsQuery {
  /**
   * @param userId - идентификатор владельца (фильтр обязателен).
   * @param month - номер месяца (1–12). Используется только вместе с `year`.
   * @param year - год (4-значный). Без него `month` игнорируется.
   */
  constructor(
    public readonly userId: string,
    public readonly month?: number,
    public readonly year?: number,
  ) {}
}
