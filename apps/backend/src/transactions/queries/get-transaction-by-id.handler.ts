import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTransactionByIdQuery } from '../contracts';
import { TransactionsService } from '../transactions.service';

/**
 * Хэндлер CQRS-запроса {@link GetTransactionByIdQuery}.
 * Тонкая обёртка: делегирует чтение сервису.
 */
@QueryHandler(GetTransactionByIdQuery)
export class GetTransactionByIdHandler implements IQueryHandler<GetTransactionByIdQuery> {
  constructor(private readonly service: TransactionsService) {}

  /**
   * @param query - запрос с `id` транзакции и `userId` владельца.
   * @returns транзакцию (см. {@link TransactionsService.findOneByUser}).
   * @throws {NotFoundException} если транзакция не найдена или чужая.
   */
  execute(query: GetTransactionByIdQuery) {
    return this.service.findOneByUser(query.id, query.userId);
  }
}
