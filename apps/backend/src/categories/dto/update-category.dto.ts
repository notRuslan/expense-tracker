import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDtoImpl } from './create-category.dto';
import type { UpdateCategoryDto } from '@expense-tracker/shared';

export class UpdateCategoryDtoImpl
  extends PartialType(CreateCategoryDtoImpl)
  implements UpdateCategoryDto {}
