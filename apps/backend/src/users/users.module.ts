import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersService } from './users.service';
import { CreateUserHandler } from './commands/create-user.handler';
import { GetUserByEmailHandler } from './queries/get-user-by-email.handler';
import { GetUserByIdHandler } from './queries/get-user-by-id.handler';

@Module({
  imports: [CqrsModule],
  providers: [UsersService, CreateUserHandler, GetUserByEmailHandler, GetUserByIdHandler],
})
export class UsersModule {}
