import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import type { CreateCategoryDto } from '@expense-tracker/shared';

export class CreateCategoryDtoImpl implements CreateCategoryDto {
  @ApiProperty({ example: 'Еда' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name: string;

  @ApiProperty({ example: '#FF5733' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex color, e.g. #FF5733' })
  color: string;

  @ApiProperty({ example: 'food' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  icon: string;
}
