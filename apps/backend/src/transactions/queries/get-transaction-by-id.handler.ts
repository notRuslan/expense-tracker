import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTransactionByIdQuery } from '../contracts';
import { TransactionsService } from '../transactions.service';

@QueryHandler(GetTransactionByIdQuery)
export class GetTransactionByIdHandler implements IQueryHandler<GetTransactionByIdQuery> {
  constructor(private readonly service: TransactionsService) {}

  execute(query: GetTransactionByIdQuery) {
    return this.service.findOneByUser(query.id, query.userId);
  }
}
