# Developer Guide

Пошаговые инструкции для типовых задач в проекте.

---

## Добавить новый backend-модуль

Пример: модуль `Budgets`.

### 1. Создать структуру папок

```
apps/backend/src/budgets/
├── contracts/
│   ├── create-budget.command.ts
│   ├── get-budgets.query.ts
│   ├── get-budget-by-id.query.ts
│   ├── update-budget.command.ts
│   ├── delete-budget.command.ts
│   └── index.ts
├── commands/
│   ├── create-budget.handler.ts
│   ├── update-budget.handler.ts
│   └── delete-budget.handler.ts
├── queries/
│   ├── get-budgets.handler.ts
│   └── get-budget-by-id.handler.ts
├── dto/
│   ├── create-budget.dto.ts
│   └── update-budget.dto.ts
├── budgets.module.ts
├── budgets.controller.ts
└── budgets.service.ts
```

### 2. Написать контракты

**`contracts/create-budget.command.ts`:**
```ts
export class CreateBudgetCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: CreateBudgetDto,
  ) {}
}
```

**`contracts/get-budgets.query.ts`:**
```ts
export class GetBudgetsQuery {
  constructor(public readonly userId: string) {}
}
```

**`contracts/index.ts`** — barrel:
```ts
export * from './create-budget.command';
export * from './get-budgets.query';
// ...
```

### 3. Написать DTO

```ts
// dto/create-budget.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import type { CreateBudgetDto } from '@expense-tracker/shared';

export class CreateBudgetDtoImpl implements CreateBudgetDto {
  @ApiProperty({ example: 'Еда на месяц' })
  @IsString()
  @MaxLength(64)
  name: string;

  @ApiProperty({ example: 15000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  limit: number;
}
```

```ts
// dto/update-budget.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateBudgetDtoImpl } from './create-budget.dto';
import type { UpdateBudgetDto } from '@expense-tracker/shared';

export class UpdateBudgetDtoImpl
  extends PartialType(CreateBudgetDtoImpl)
  implements UpdateBudgetDto {}
```

### 4. Написать сервис

```ts
// budgets.service.ts
@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBudgetDto): Promise<Budget> { ... }
  async findAllByUser(userId: string): Promise<Budget[]> { ... }
  async findOneByUser(id: string, userId: string): Promise<Budget> { ... }
  async update(id: string, userId: string, dto: UpdateBudgetDto): Promise<Budget> { ... }
  async delete(id: string, userId: string): Promise<void> { ... }
}
```

Все методы фильтруют по `userId`. При `findOneByUser` — бросать `NotFoundException` если не найдено.

### 5. Написать хэндлеры

```ts
// commands/create-budget.handler.ts
@CommandHandler(CreateBudgetCommand)
export class CreateBudgetHandler implements ICommandHandler<CreateBudgetCommand> {
  constructor(
    private readonly service: BudgetsService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: CreateBudgetCommand) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(command.userId));
    if (!user) throw new UnauthorizedException();
    return this.service.create(command.userId, command.dto);
  }
}
```

Query-хэндлеры — тонкая обёртка, только делегируют в сервис.

### 6. Написать контроллер

```ts
@ApiTags('budgets')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'JWT отсутствует или невалиден' })
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Создать бюджет' })
  @ApiCreatedResponse({ description: 'Бюджет создан' })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateBudgetDtoImpl) {
    return this.commandBus.execute(new CreateBudgetCommand(user.userId, dto));
  }
  // ...
}
```

### 7. Собрать модуль

```ts
// budgets.module.ts
@Module({
  imports: [CqrsModule, AuthModule, UsersModule],
  controllers: [BudgetsController],
  providers: [
    BudgetsService,
    CreateBudgetHandler,
    UpdateBudgetHandler,
    DeleteBudgetHandler,
    GetBudgetsHandler,
    GetBudgetByIdHandler,
  ],
})
export class BudgetsModule {}
```

### 8. Зарегистрировать в AppModule

```ts
// app.module.ts
@Module({
  imports: [
    // ... существующие
    BudgetsModule,
  ],
})
export class AppModule {}
```

### 9. Проверить

```bash
npm run build -w apps/backend
npm run lint -w apps/backend
```

---

## Добавить миграцию (изменить схему БД)

### 1. Обновить `schema.prisma`

```prisma
// apps/backend/prisma/schema.prisma
model Budget {
  id        String   @id @default(cuid())
  name      String
  limit     Decimal  @db.Decimal(12, 2)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

Не забыть добавить обратную сторону связи в `User`:
```prisma
model User {
  // ...
  budgets Budget[]
}
```

### 2. Создать и применить миграцию

```bash
npm run prisma:migrate
# Введите имя миграции: add_budgets_table
```

Prisma создаст `apps/backend/prisma/migrations/<timestamp>_add_budgets_table/migration.sql`.
Закоммитить этот файл вместе с `schema.prisma`.

### 3. Регенерировать Prisma Client

```bash
npm run prisma:generate
```

### 4. Синхронизировать shared-типы

Добавить в `packages/shared/src/types/budget.ts`:
```ts
export interface Budget {
  id: string;
  name: string;
  limit: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

Добавить реэкспорт в `packages/shared/src/index.ts`:
```ts
export * from './types/budget';
```

### 5. Проверить оба приложения

```bash
npm run build
```

---

## Добавить фичу на фронтенд (FSD)

Пример: фича `budgets` со списком бюджетов.

### 1. Создать структуру

```
apps/frontend/src/features/budgets/
├── api/
│   └── budgets-api.ts      # функции запросов к /budgets
├── model/
│   └── use-budgets.ts      # хук состояния списка
├── ui/
│   └── budgets-list.tsx    # компонент списка
└── index.ts                # публичное API фичи
```

### 2. Написать API-функции

```ts
// features/budgets/api/budgets-api.ts
import { apiRequest } from '@/shared/api/client';
import type { Budget } from '@expense-tracker/shared';

export function getBudgets(token: string): Promise<Budget[]> {
  return apiRequest<Budget[]>('/budgets', {}, token);
}
```

### 3. Написать хук

```ts
// features/budgets/model/use-budgets.ts
'use client';
import { useEffect, useState } from 'react';
import { getToken } from '@/entities/session';
import { getBudgets } from '../api/budgets-api';
import type { Budget } from '@expense-tracker/shared';

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    getBudgets(token)
      .then(setBudgets)
      .finally(() => setLoading(false));
  }, []);

  return { budgets, loading };
}
```

### 4. Написать компонент

```tsx
// features/budgets/ui/budgets-list.tsx
'use client';
import { useBudgets } from '../model/use-budgets';

export function BudgetsList() {
  const { budgets, loading } = useBudgets();
  if (loading) return <p>Загрузка...</p>;
  return (
    <ul>
      {budgets.map((b) => (
        <li key={b.id}>{b.name} — {b.limit} ₽</li>
      ))}
    </ul>
  );
}
```

### 5. Экспортировать через index.ts

```ts
// features/budgets/index.ts
export { BudgetsList } from './ui/budgets-list';
export { useBudgets } from './model/use-budgets';
```

### 6. Использовать в странице

```tsx
// app/budgets/page.tsx
import { BudgetsList } from '@/features/budgets';

export default function BudgetsPage() {
  return (
    <main>
      <h1>Бюджеты</h1>
      <BudgetsList />
    </main>
  );
}
```

**Правило FSD:** страница (`app/`) импортирует из `features/` — это допустимо. `features/` не должен импортировать из `app/`.

---

## Добавить shadcn/ui компонент

```bash
npx shadcn@latest add <component> -c apps/frontend
```

Компонент появится в `apps/frontend/src/shared/ui/`. Импортировать через `@/shared/ui/<component>`.

---

## Чеклист перед коммитом

- [ ] `npm run build -w apps/backend` — без ошибок.
- [ ] `npm run lint -w apps/backend` — без предупреждений.
- [ ] Если изменена схема Prisma — создана миграция и обновлены типы в shared.
- [ ] Новые env-переменные добавлены в `.env.example`.
- [ ] Swagger-декораторы добавлены на все новые эндпоинты.
- [ ] JSDoc добавлен на публичные методы.
- [ ] Коммит-сообщение — в формате Conventional Commits (см. `CLAUDE.md`).
