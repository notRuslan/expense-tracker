import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { DeleteCategoryCommand } from '../contracts';
import { CategoriesService } from '../categories.service';
import { GetUserByIdQuery } from '../../users/contracts';

@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand> {
  constructor(
    private readonly service: CategoriesService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: DeleteCategoryCommand) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(command.userId));
    if (!user) throw new UnauthorizedException();
    return this.service.delete(command.id, command.userId);
  }
}
