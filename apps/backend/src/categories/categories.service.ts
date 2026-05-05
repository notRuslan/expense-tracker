import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CreateCategoryDto, UpdateCategoryDto } from '@expense-tracker/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: { ...dto, userId },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(`Category "${dto.name}" already exists`);
      }
      throw err;
    }
  }

  findAllByUser(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findOneByUser(id: string, userId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async update(id: string, userId: string, dto: UpdateCategoryDto) {
    await this.findOneByUser(id, userId);
    try {
      return await this.prisma.category.update({
        where: { id },
        data: dto,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(`Category "${dto.name}" already exists`);
      }
      throw err;
    }
  }

  async delete(id: string, userId: string) {
    await this.findOneByUser(id, userId);
    await this.prisma.category.delete({ where: { id } });
  }
}
