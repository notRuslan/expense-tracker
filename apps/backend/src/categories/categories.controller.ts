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
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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
@ApiUnauthorizedResponse({ description: 'JWT отсутствует или невалиден' })
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Создать категорию',
    description: 'Создаёт категорию для текущего пользователя. Имя уникально в рамках одного пользователя.',
  })
  @ApiCreatedResponse({ description: 'Категория создана. Возвращает созданный объект `Category`.' })
  @ApiBadRequestResponse({ description: 'Валидация DTO не пройдена (неверный формат цвета, длина name/icon и т.п.)' })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateCategoryDtoImpl) {
    return this.commandBus.execute(new CreateCategoryCommand(user.userId, dto));
  }

  @Get()
  @ApiOperation({
    summary: 'Список категорий',
    description: 'Возвращает все категории текущего пользователя.',
  })
  @ApiOkResponse({ description: 'Массив объектов `Category`.' })
  findAll(@CurrentUser() user: JwtUser) {
    return this.queryBus.execute(new GetCategoriesQuery(user.userId));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить категорию по id',
    description: 'Возвращает категорию текущего пользователя по идентификатору.',
  })
  @ApiParam({ name: 'id', description: 'Идентификатор категории (cuid)', example: 'clx0a1b2c3d4e5f6g7h8' })
  @ApiOkResponse({ description: 'Объект `Category`.' })
  @ApiNotFoundResponse({ description: 'Категория не найдена или принадлежит другому пользователю' })
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.queryBus.execute(new GetCategoryByIdQuery(id, user.userId));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Обновить категорию',
    description: 'Частично обновляет категорию. Передаются только изменяемые поля.',
  })
  @ApiParam({ name: 'id', description: 'Идентификатор категории (cuid)', example: 'clx0a1b2c3d4e5f6g7h8' })
  @ApiOkResponse({ description: 'Обновлённый объект `Category`.' })
  @ApiBadRequestResponse({ description: 'Валидация DTO не пройдена' })
  @ApiNotFoundResponse({ description: 'Категория не найдена или принадлежит другому пользователю' })
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDtoImpl,
  ) {
    return this.commandBus.execute(new UpdateCategoryCommand(id, user.userId, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Удалить категорию',
    description: 'Удаляет категорию. У связанных транзакций `categoryId` обнуляется (`onDelete: SetNull`).',
  })
  @ApiParam({ name: 'id', description: 'Идентификатор категории (cuid)', example: 'clx0a1b2c3d4e5f6g7h8' })
  @ApiNoContentResponse({ description: 'Категория удалена' })
  @ApiNotFoundResponse({ description: 'Категория не найдена или принадлежит другому пользователю' })
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.commandBus.execute(new DeleteCategoryCommand(id, user.userId));
  }
}
