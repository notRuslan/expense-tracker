import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator';
import { CreateCategoryDtoImpl } from './dto/create-category.dto';
import { UpdateCategoryDtoImpl } from './dto/update-category.dto';
import {
  CreateCategoryCommand,
  DeleteCategoryCommand,
  GetCategoriesQuery,
  GetCategoryByIdQuery,
  UpdateCategoryCommand,
} from './contracts';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateCategoryDtoImpl) {
    return this.commandBus.execute(new CreateCategoryCommand(user.userId, dto));
  }

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.queryBus.execute(new GetCategoriesQuery(user.userId));
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.queryBus.execute(new GetCategoryByIdQuery(id, user.userId));
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDtoImpl,
  ) {
    return this.commandBus.execute(new UpdateCategoryCommand(id, user.userId, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.commandBus.execute(new DeleteCategoryCommand(id, user.userId));
  }
}
