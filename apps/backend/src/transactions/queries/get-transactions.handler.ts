import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTransactionsQuery } from '../contracts';
import { TransactionsService } from '../transactions.service';

/**
 * Хэндлер CQRS-запроса {@link GetTransactionsQuery}.
 * Тонкая обёртка: делегирует список со сводкой сервису.
 */
@QueryHandler(GetTransactionsQuery)
export class GetTransactionsHandler implements IQueryHandler<GetTransactionsQuery> {
  constructor(private readonly service: TransactionsService) {}

  /**
   * @param query - запрос с `userId` и опциональным фильтром `month` / `year`.
   * @returns `{ items, summary }` (см. {@link TransactionsService.findAllByUser}).
   */
  execute(query: GetTransactionsQuery) {
    return this.service.findAllByUser(query.userId, query.month, query.year);
  }
}
