import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { CreateCategoryCommand } from '../contracts';
import { CategoriesService } from '../categories.service';
import { GetUserByIdQuery } from '../../users/contracts';

@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand> {
  constructor(
    private readonly service: CategoriesService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: CreateCategoryCommand) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(command.userId));
    if (!user) throw new UnauthorizedException();
    return this.service.create(command.userId, command.dto);
  }
}
