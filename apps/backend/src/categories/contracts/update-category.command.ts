import type { UpdateCategoryDto } from '@expense-tracker/shared';

export class UpdateCategoryCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly dto: UpdateCategoryDto,
  ) {}
}
