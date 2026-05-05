import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserCommand } from './contracts';
import type { GetUserByEmailResult, GetUserByIdResult } from './contracts';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(cmd: CreateUserCommand) {
    const user = await this.prisma.user.create({
      data: {
        email: cmd.email,
        name: cmd.name,
        passwordHash: cmd.passwordHash,
      },
    });
    return user;
  }

  async findByEmail(email: string): Promise<GetUserByEmailResult | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<GetUserByIdResult | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
