import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateUserCommand, CreateUserResult } from '../contracts';
import { UsersService } from '../users.service';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, CreateUserResult> {
  constructor(private readonly usersService: UsersService) {}

  async execute(command: CreateUserCommand): Promise<CreateUserResult> {
    try {
      const user = await this.usersService.create(command);
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Пользователь с таким email уже существует');
      }
      throw err;
    }
  }
}
