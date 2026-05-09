import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Transaction as TransactionRow } from '@prisma/client';
import type {
  CreateTransactionDto,
  Transaction,
  TransactionsListResponse,
  TransactionsSummary,
  UpdateTransactionDto,
} from '@expense-tracker/shared';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Фасад над Prisma для домена «Транзакции».
 *
 * Все публичные методы предполагают, что `userId` уже валиден
 * (взят из JWT в контроллере) и используют его как обязательный
 * фильтр — чужие данные не возвращаются и не модифицируются.
 *
 * Используется CQRS-хэндлерами модуля; контроллер обращается к нему
 * только опосредованно через `CommandBus` / `QueryBus`.
 */
@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создаёт транзакцию для пользователя.
   *
   * @param userId - идентификатор владельца (из JWT).
   * @param dto - валидированные данные транзакции.
   * @returns созданную транзакцию в публичной форме {@link Transaction}.
   * @throws {NotFoundException} если `dto.categoryId` указан, но категория
   *   не существует или принадлежит другому пользователю.
   */
  async create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    if (dto.categoryId) {
      await this.assertCategoryOwnership(dto.categoryId, userId);
    }
    const row = await this.prisma.transaction.create({
      data: {
        userId,
        amount: new Prisma.Decimal(dto.amount),
        type: dto.type,
        description: dto.description ?? null,
        date: new Date(dto.date),
        categoryId: dto.categoryId ?? null,
      },
    });
    return mapTransaction(row);
  }

  /**
   * Возвращает список транзакций пользователя (по убыванию даты)
   * и агрегированную сводку (доходы / расходы / баланс).
   *
   * Семантика фильтра по дате:
   * - оба параметра не заданы — все транзакции пользователя;
   * - задан только `year` — все транзакции за этот год (UTC);
   * - заданы `month` + `year` — за указанный месяц года (UTC).
   * Запрос `month` без `year` интерпретируется как «весь набор» (фильтр не применяется).
   *
   * @param userId - идентификатор владельца.
   * @param month - номер месяца (1–12), опционально.
   * @param year - год, опционально.
   * @returns объект `{ items, summary }` со списком и сводкой.
   */
  async findAllByUser(
    userId: string,
    month?: number,
    year?: number,
  ): Promise<TransactionsListResponse> {
    const where: Prisma.TransactionWhereInput = { userId };
    if (year !== undefined) {
      const monthIndex = month ? month - 1 : 0;
      const gte = new Date(Date.UTC(year, monthIndex, 1));
      const lt = month
        ? new Date(Date.UTC(year, monthIndex + 1, 1))
        : new Date(Date.UTC(year + 1, 0, 1));
      where.date = { gte, lt };
    }

    const [rows, grouped] = await Promise.all([
      this.prisma.transaction.findMany({ where, orderBy: { date: 'desc' } }),
      this.prisma.transaction.groupBy({
        by: ['type'],
        where,
        _sum: { amount: true },
      }),
    ]);

    const summary: TransactionsSummary = { totalIncome: 0, totalExpense: 0, balance: 0 };
    for (const g of grouped) {
      const sum = g._sum.amount ? Number(g._sum.amount) : 0;
      if (g.type === 'income') summary.totalIncome = sum;
      else summary.totalExpense = sum;
    }
    summary.balance = summary.totalIncome - summary.totalExpense;

    return { items: rows.map(mapTransaction), summary };
  }

  /**
   * Возвращает одну транзакцию пользователя по идентификатору.
   *
   * @param id - идентификатор транзакции.
   * @param userId - идентификатор владельца.
   * @returns транзакцию в публичной форме {@link Transaction}.
   * @throws {NotFoundException} если транзакция не найдена
   *   или принадлежит другому пользователю.
   */
  async findOneByUser(id: string, userId: string): Promise<Transaction> {
    const row = await this.prisma.transaction.findFirst({ where: { id, userId } });
    if (!row) throw new NotFoundException(`Transaction ${id} not found`);
    return mapTransaction(row);
  }

  /**
   * Частично обновляет транзакцию пользователя.
   * Изменяются только переданные в `dto` поля. Передача `categoryId: null`
   * отвязывает транзакцию от категории (через `disconnect`).
   *
   * @param id - идентификатор транзакции.
   * @param userId - идентификатор владельца.
   * @param dto - частичный набор обновляемых полей.
   * @returns обновлённую транзакцию.
   * @throws {NotFoundException} если транзакция не найдена/чужая,
   *   либо если `dto.categoryId` указывает на чужую/несуществующую категорию.
   */
  async update(id: string, userId: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const existing = await this.prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException(`Transaction ${id} not found`);
    if (dto.categoryId) {
      await this.assertCategoryOwnership(dto.categoryId, userId);
    }
    const data: Prisma.TransactionUpdateInput = {};
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.categoryId !== undefined) {
      data.category = dto.categoryId
        ? { connect: { id: dto.categoryId } }
        : { disconnect: true };
    }
    const row = await this.prisma.transaction.update({ where: { id }, data });
    return mapTransaction(row);
  }

  /**
   * Удаляет транзакцию пользователя.
   *
   * @param id - идентификатор транзакции.
   * @param userId - идентификатор владельца.
   * @returns `void` после успешного удаления.
   * @throws {NotFoundException} если транзакция не найдена/чужая.
   */
  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException(`Transaction ${id} not found`);
    await this.prisma.transaction.delete({ where: { id } });
  }

  /**
   * Проверяет, что категория существует и принадлежит пользователю.
   * Используется как guard перед записью `categoryId` в транзакцию,
   * чтобы исключить привязку к чужим категориям.
   *
   * @param categoryId - идентификатор категории.
   * @param userId - идентификатор пользователя-владельца.
   * @throws {NotFoundException} если категория отсутствует или чужая.
   */
  private async assertCategoryOwnership(categoryId: string, userId: string): Promise<void> {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
      select: { id: true },
    });
    if (!category) throw new NotFoundException(`Category ${categoryId} not found`);
  }
}

/**
 * Преобразует строку Prisma в публичный DTO {@link Transaction}:
 * `Decimal` → `number`, `Date` → ISO-строка.
 *
 * @param row - запись `Transaction` из Prisma Client.
 * @returns транзакцию в форме, безопасной для сериализации в JSON.
 */
function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    amount: Number(row.amount),
    type: row.type,
    description: row.description,
    date: row.date.toISOString(),
    categoryId: row.categoryId,
    userId: row.userId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
