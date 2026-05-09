import { PartialType } from '@nestjs/swagger';
import { CreateTransactionDtoImpl } from './create-transaction.dto';
import type { UpdateTransactionDto } from '@expense-tracker/shared';

/**
 * Тело запроса `PATCH /transactions/:id`.
 * Все поля {@link CreateTransactionDtoImpl} становятся опциональными
 * через `PartialType` из `@nestjs/swagger` — Swagger-метаданные сохраняются.
 *
 * Реализует контракт {@link UpdateTransactionDto} из shared-пакета.
 */
export class UpdateTransactionDtoImpl
  extends PartialType(CreateTransactionDtoImpl)
  implements UpdateTransactionDto {}
