import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserByIdQuery, GetUserByIdResult } from '../contracts';
import { UsersService } from '../users.service';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<
  GetUserByIdQuery,
  GetUserByIdResult | null
> {
  constructor(private readonly usersService: UsersService) {}

  execute(query: GetUserByIdQuery): Promise<GetUserByIdResult | null> {
    return this.usersService.findById(query.id);
  }
}
