import type { CreateTransactionDto } from '@expense-tracker/shared';

export class CreateTransactionCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: CreateTransactionDto,
  ) {}
}
