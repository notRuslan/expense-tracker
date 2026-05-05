import type { CreateCategoryDto } from '@expense-tracker/shared';

export class CreateCategoryCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: CreateCategoryDto,
  ) {}
}
