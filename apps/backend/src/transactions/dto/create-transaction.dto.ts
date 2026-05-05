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

export class CreateTransactionDtoImpl implements CreateTransactionDto {
  @ApiProperty({ example: 1500.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: TRANSACTION_TYPES, example: 'expense' })
  @IsEnum(TRANSACTION_TYPES)
  type: TransactionType;

  @ApiPropertyOptional({ example: 'Покупка продуктов' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ example: '2026-05-05T12:00:00.000Z' })
  @IsISO8601()
  date: string;

  @ApiPropertyOptional({ example: 'clx0a1b2c3d4e5f6g7h8' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
