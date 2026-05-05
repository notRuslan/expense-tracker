import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCategoriesQuery } from '../contracts';
import { CategoriesService } from '../categories.service';

@QueryHandler(GetCategoriesQuery)
export class GetCategoriesHandler implements IQueryHandler<GetCategoriesQuery> {
  constructor(private readonly service: CategoriesService) {}

  execute(query: GetCategoriesQuery) {
    return this.service.findAllByUser(query.userId);
  }
}
