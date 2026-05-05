import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCategoryByIdQuery } from '../contracts';
import { CategoriesService } from '../categories.service';

@QueryHandler(GetCategoryByIdQuery)
export class GetCategoryByIdHandler implements IQueryHandler<GetCategoryByIdQuery> {
  constructor(private readonly service: CategoriesService) {}

  execute(query: GetCategoryByIdQuery) {
    return this.service.findOneByUser(query.id, query.userId);
  }
}
