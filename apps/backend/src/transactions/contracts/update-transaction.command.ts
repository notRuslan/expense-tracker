import type { UpdateTransactionDto } from '@expense-tracker/shared';

export class UpdateTransactionCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly dto: UpdateTransactionDto,
  ) {}
}
