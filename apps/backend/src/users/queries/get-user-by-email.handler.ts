import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserByEmailQuery, GetUserByEmailResult } from '../contracts';
import { UsersService } from '../users.service';

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler implements IQueryHandler<
  GetUserByEmailQuery,
  GetUserByEmailResult | null
> {
  constructor(private readonly usersService: UsersService) {}

  execute(query: GetUserByEmailQuery): Promise<GetUserByEmailResult | null> {
    return this.usersService.findByEmail(query.email);
  }
}
