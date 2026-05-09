import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import type { CreateTransactionDto, TransactionType } from '@expense-tracker/shared';

const TRANSACTION_TYPES: TransactionType[] = ['income', 'expense'];

/**
 * Тело запроса `POST /transactions`.
 * Реализует контракт {@link CreateTransactionDto} из shared-пакета.
 *
 * Валидация выполняется глобальным `ValidationPipe`
 * (`whitelist`, `transform`, `forbidNonWhitelisted`).
 */
export class CreateTransactionDtoImpl implements CreateTransactionDto {
  /** Сумма транзакции в основной валюте. Положительная, до 2 знаков после запятой. */
  @ApiProperty({ example: 1500.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  /** Тип операции: доход (`income`) или расход (`expense`). */
  @ApiProperty({ enum: TRANSACTION_TYPES, example: 'expense' })
  @IsEnum(TRANSACTION_TYPES)
  type: TransactionType;

  /** Свободный комментарий к транзакции (до 255 символов). Опционально. */
  @ApiPropertyOptional({ example: 'Покупка продуктов' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  /** Дата транзакции в формате ISO 8601 (например, `2026-05-05T12:00:00.000Z`). */
  @ApiProperty({ example: '2026-05-05T12:00:00.000Z' })
  @IsISO8601()
  date: string;

  /** Идентификатор категории. Должен принадлежать тому же пользователю. Опционально. */
  @ApiPropertyOptional({ example: 'clx0a1b2c3d4e5f6g7h8' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
