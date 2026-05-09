/**
 * CQRS-запрос получения пользователя по идентификатору.
 *
 * Используется хэндлерами команд модуля транзакций для проверки,
 * что пользователь из JWT всё ещё существует в БД (защита от
 * валидного токена удалённой учётной записи).
 *
 * Обрабатывается `GetUserByIdHandler` в модуле `users`.
 */
export class GetUserByIdQuery {
  /**
   * @param id - идентификатор пользователя (`User.id` из Prisma).
   */
  constructor(public readonly id: string) {}
}

/**
 * Результат {@link GetUserByIdQuery}.
 * Хэндлер возвращает `null`, если пользователь не найден
 * (без `passwordHash` — это публичный срез сущности).
 */
export interface GetUserByIdResult {
  /** Идентификатор пользователя. */
  id: string;
  /** Email пользователя. */
  email: string;
  /** Отображаемое имя. */
  name: string;
  /** Дата создания учётной записи. */
  createdAt: Date;
  /** Дата последнего обновления учётной записи. */
  updatedAt: Date;
}
