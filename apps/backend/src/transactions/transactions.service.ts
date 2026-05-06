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

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findAllByUser(
    userId: string,
    month?: number,
    year?: number,
    page?: number,
    limit?: number,
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

    const currentPage = page && page > 0 ? page : 1;
    const currentLimit = limit && limit > 0 ? limit : 10;
    const skip = (currentPage - 1) * currentLimit;

    const [rows, total, grouped] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: currentLimit,
      }),
      this.prisma.transaction.count({ where }),
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

    return {
      items: rows.map(mapTransaction),
      summary,
      total,
      page: currentPage,
      limit: currentLimit,
    };
  }

  async findOneByUser(id: string, userId: string): Promise<Transaction> {
    const row = await this.prisma.transaction.findFirst({ where: { id, userId } });
    if (!row) throw new NotFoundException(`Transaction ${id} not found`);
    return mapTransaction(row);
  }

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

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException(`Transaction ${id} not found`);
    await this.prisma.transaction.delete({ where: { id } });
  }

  private async assertCategoryOwnership(categoryId: string, userId: string): Promise<void> {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
      select: { id: true },
    });
    if (!category) throw new NotFoundException(`Category ${categoryId} not found`);
  }
}

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
