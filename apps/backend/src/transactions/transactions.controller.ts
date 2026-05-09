import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
import { CreateTransactionDtoImpl } from './dto/create-transaction.dto';
import { UpdateTransactionDtoImpl } from './dto/update-transaction.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions.query.dto';
import {
  CreateTransactionCommand,
  DeleteTransactionCommand,
  GetTransactionByIdQuery,
  GetTransactionsQuery,
  UpdateTransactionCommand,
} from './contracts';

/**
 * REST-контроллер ресурса `/transactions`.
 *
 * Все эндпоинты защищены {@link JwtAuthGuard}; `userId` берётся
 * исключительно из JWT через {@link CurrentUser}, не из тела/query —
 * это исключает работу с чужими данными.
 *
 * Контроллер не содержит бизнес-логики: транслирует HTTP-вызовы
 * в CQRS-команды/запросы через `CommandBus` / `QueryBus`.
 */
@ApiTags('transactions')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'JWT отсутствует, невалиден или пользователь удалён' })
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * `POST /transactions` — создать транзакцию.
   *
   * @param user - текущий пользователь из JWT.
   * @param dto - тело запроса {@link CreateTransactionDtoImpl}.
   * @returns созданную транзакцию.
   * @throws {UnauthorizedException} если токен отсутствует/невалиден или пользователь удалён.
   * @throws {NotFoundException} если указана чужая/несуществующая `categoryId`.
   * @throws {BadRequestException} при ошибке валидации DTO.
   */
  @Post()
  @ApiOperation({
    summary: 'Создать транзакцию',
    description: 'Создаёт транзакцию для текущего пользователя. `categoryId` опционален; если указан — категория должна принадлежать пользователю.',
  })
  @ApiCreatedResponse({ description: 'Транзакция создана. Возвращает созданный объект `Transaction`.' })
  @ApiBadRequestResponse({ description: 'Валидация DTO не пройдена (неверный тип/сумма/дата и т.п.)' })
  @ApiNotFoundResponse({ description: 'Указанная `categoryId` не найдена или принадлежит другому пользователю' })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateTransactionDtoImpl) {
    return this.commandBus.execute(new CreateTransactionCommand(user.userId, dto));
  }

  /**
   * `GET /transactions` — список транзакций пользователя со сводкой.
   * Поддерживает фильтрацию по периоду через query: `?month=&year=`.
   *
   * @param user - текущий пользователь из JWT.
   * @param query - параметры фильтра {@link ListTransactionsQueryDto}.
   * @returns `{ items, summary }`.
   * @throws {UnauthorizedException} если токен отсутствует/невалиден.
   * @throws {BadRequestException} при невалидных значениях `month` / `year`.
   */
  @Get()
  @ApiOperation({
    summary: 'Список транзакций со сводкой',
    description:
      'Возвращает `{ items, summary }`. Без фильтра — все транзакции пользователя; только `year` — за весь год; `month` + `year` — за указанный месяц. `month` без `year` игнорируется.',
  })
  @ApiOkResponse({ description: 'Список транзакций (по убыванию даты) и агрегаты по доходу/расходу/балансу.' })
  @ApiBadRequestResponse({ description: 'Невалидные `month` (1–12) или `year` (1970–9999)' })
  findAll(@CurrentUser() user: JwtUser, @Query() query: ListTransactionsQueryDto) {
    return this.queryBus.execute(
      new GetTransactionsQuery(user.userId, query.month, query.year),
    );
  }

  /**
   * `GET /transactions/:id` — получить транзакцию по идентификатору.
   *
   * @param user - текущий пользователь из JWT.
   * @param id - идентификатор транзакции из URL.
   * @returns транзакцию.
   * @throws {UnauthorizedException} если токен отсутствует/невалиден.
   * @throws {NotFoundException} если транзакция не найдена или принадлежит другому пользователю.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Получить транзакцию по id',
    description: 'Возвращает транзакцию текущего пользователя по идентификатору.',
  })
  @ApiParam({ name: 'id', description: 'Идентификатор транзакции (cuid)', example: 'clx0a1b2c3d4e5f6g7h8' })
  @ApiOkResponse({ description: 'Объект `Transaction`.' })
  @ApiNotFoundResponse({ description: 'Транзакция не найдена или принадлежит другому пользователю' })
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.queryBus.execute(new GetTransactionByIdQuery(id, user.userId));
  }

  /**
   * `PATCH /transactions/:id` — частичное обновление транзакции.
   *
   * @param user - текущий пользователь из JWT.
   * @param id - идентификатор транзакции из URL.
   * @param dto - частичный набор полей {@link UpdateTransactionDtoImpl}.
   * @returns обновлённую транзакцию.
   * @throws {UnauthorizedException} если токен отсутствует/невалиден или пользователь удалён.
   * @throws {NotFoundException} если транзакция или указанная категория не найдены/чужие.
   * @throws {BadRequestException} при ошибке валидации DTO.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Обновить транзакцию',
    description: 'Частично обновляет транзакцию. Передаются только изменяемые поля. `categoryId: null` отвязывает категорию.',
  })
  @ApiParam({ name: 'id', description: 'Идентификатор транзакции (cuid)', example: 'clx0a1b2c3d4e5f6g7h8' })
  @ApiOkResponse({ description: 'Обновлённый объект `Transaction`.' })
  @ApiBadRequestResponse({ description: 'Валидация DTO не пройдена' })
  @ApiNotFoundResponse({ description: 'Транзакция не найдена/чужая или указана чужая `categoryId`' })
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDtoImpl,
  ) {
    return this.commandBus.execute(new UpdateTransactionCommand(id, user.userId, dto));
  }

  /**
   * `DELETE /transactions/:id` — удалить транзакцию (HTTP 204).
   *
   * @param user - текущий пользователь из JWT.
   * @param id - идентификатор транзакции из URL.
   * @returns пустой ответ со статусом 204.
   * @throws {UnauthorizedException} если токен отсутствует/невалиден или пользователь удалён.
   * @throws {NotFoundException} если транзакция не найдена/чужая.
   */
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Удалить транзакцию',
    description: 'Удаляет транзакцию текущего пользователя. Возвращает 204 без тела.',
  })
  @ApiParam({ name: 'id', description: 'Идентификатор транзакции (cuid)', example: 'clx0a1b2c3d4e5f6g7h8' })
  @ApiNoContentResponse({ description: 'Транзакция удалена' })
  @ApiNotFoundResponse({ description: 'Транзакция не найдена или принадлежит другому пользователю' })
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.commandBus.execute(new DeleteTransactionCommand(id, user.userId));
  }
}
