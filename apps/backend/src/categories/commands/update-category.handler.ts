import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { UpdateCategoryCommand } from '../contracts';
import { CategoriesService } from '../categories.service';
import { GetUserByIdQuery } from '../../users/contracts';

@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler implements ICommandHandler<UpdateCategoryCommand> {
  constructor(
    private readonly service: CategoriesService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: UpdateCategoryCommand) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(command.userId));
    if (!user) throw new UnauthorizedException();
    return this.service.update(command.id, command.userId, command.dto);
  }
}
