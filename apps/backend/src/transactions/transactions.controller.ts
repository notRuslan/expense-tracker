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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateTransactionDtoImpl) {
    return this.commandBus.execute(new CreateTransactionCommand(user.userId, dto));
  }

  @Get()
  findAll(@CurrentUser() user: JwtUser, @Query() query: ListTransactionsQueryDto) {
    return this.queryBus.execute(
      new GetTransactionsQuery(user.userId, query.month, query.year),
    );
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.queryBus.execute(new GetTransactionByIdQuery(id, user.userId));
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDtoImpl,
  ) {
    return this.commandBus.execute(new UpdateTransactionCommand(id, user.userId, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.commandBus.execute(new DeleteTransactionCommand(id, user.userId));
  }
}
