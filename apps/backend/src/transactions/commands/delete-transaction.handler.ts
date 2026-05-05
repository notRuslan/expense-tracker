import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { DeleteTransactionCommand } from '../contracts';
import { TransactionsService } from '../transactions.service';
import { GetUserByIdQuery } from '../../users/contracts';

@CommandHandler(DeleteTransactionCommand)
export class DeleteTransactionHandler implements ICommandHandler<DeleteTransactionCommand> {
  constructor(
    private readonly service: TransactionsService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: DeleteTransactionCommand) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(command.userId));
    if (!user) throw new UnauthorizedException();
    return this.service.delete(command.id, command.userId);
  }
}
