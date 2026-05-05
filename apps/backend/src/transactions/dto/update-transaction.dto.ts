import { PartialType } from '@nestjs/swagger';
import { CreateTransactionDtoImpl } from './create-transaction.dto';
import type { UpdateTransactionDto } from '@expense-tracker/shared';

export class UpdateTransactionDtoImpl
  extends PartialType(CreateTransactionDtoImpl)
  implements UpdateTransactionDto {}
