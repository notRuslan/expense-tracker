import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryHandler } from './commands/create-category.handler';
import { UpdateCategoryHandler } from './commands/update-category.handler';
import { DeleteCategoryHandler } from './commands/delete-category.handler';
import { GetCategoriesHandler } from './queries/get-categories.handler';
import { GetCategoryByIdHandler } from './queries/get-category-by-id.handler';

@Module({
  imports: [CqrsModule, AuthModule, UsersModule],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    CreateCategoryHandler,
    UpdateCategoryHandler,
    DeleteCategoryHandler,
    GetCategoriesHandler,
    GetCategoryByIdHandler,
  ],
})
export class CategoriesModule {}
