import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { UpdateTransactionCommand } from '../contracts';
import { TransactionsService } from '../transactions.service';
import { GetUserByIdQuery } from '../../users/contracts';

@CommandHandler(UpdateTransactionCommand)
export class UpdateTransactionHandler implements ICommandHandler<UpdateTransactionCommand> {
  constructor(
    private readonly service: TransactionsService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: UpdateTransactionCommand) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(command.userId));
    if (!user) throw new UnauthorizedException();
    return this.service.update(command.id, command.userId, command.dto);
  }
}
