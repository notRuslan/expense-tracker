import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTransactionsQuery } from '../contracts';
import { TransactionsService } from '../transactions.service';

@QueryHandler(GetTransactionsQuery)
export class GetTransactionsHandler implements IQueryHandler<GetTransactionsQuery> {
  constructor(private readonly service: TransactionsService) {}

  execute(query: GetTransactionsQuery) {
    return this.service.findAllByUser(
      query.userId,
      query.month,
      query.year,
      query.page,
      query.limit,
    );
  }
}
