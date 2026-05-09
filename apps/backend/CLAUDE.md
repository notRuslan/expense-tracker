# Backend — CLAUDE.md

NestJS-приложение с CQRS, Prisma ORM, JWT-авторизацией и Swagger.

## Стек

| Пакет | Роль |
|---|---|
| `@nestjs/core`, `@nestjs/common` | Фреймворк |
| `@nestjs/cqrs` | CQRS (CommandBus / QueryBus) |
| `@nestjs/swagger` | OpenAPI — `/api/docs` |
| `@nestjs/jwt` + `passport-jwt` | JWT-авторизация |
| `@prisma/client` | ORM |
| `class-validator` + `class-transformer` | Валидация DTO |
| `bcrypt` | Хэширование паролей |

## Точка входа

`src/main.ts` — поднимает HTTP на `process.env.PORT ?? 3001`, включает CORS, ставит глобальный `ValidationPipe` (`whitelist: true, transform: true, forbidNonWhitelisted: true`), публикует Swagger на `/api/docs`.

## Модули

```
src/
├── app.module.ts              # Корневой модуль
├── prisma/
│   ├── prisma.module.ts       # @Global() — экспортирует PrismaService
│   └── prisma.service.ts      # extends PrismaClient, OnModuleInit/Destroy
├── auth/
│   ├── auth.module.ts         # CqrsModule, JwtModule (async), PassportModule
│   ├── auth.controller.ts     # POST /auth/register, POST /auth/login
│   ├── auth.service.ts        # register() / login() — bcrypt + JWT sign
│   ├── strategies/jwt.strategy.ts      # Читает JWT_SECRET из ConfigService
│   ├── guards/jwt-auth.guard.ts        # Стандартный AuthGuard('jwt')
│   ├── decorators/current-user.decorator.ts  # @CurrentUser() → JwtUser
│   └── dto/                   # RegisterDtoImpl, LoginDtoImpl
├── users/
│   ├── users.module.ts        # CqrsModule
│   ├── users.service.ts       # findByEmail / findById через QueryBus
│   ├── contracts/             # CreateUserCommand, GetUserByEmailQuery, GetUserByIdQuery
│   ├── commands/              # CreateUserHandler
│   └── queries/               # GetUserByEmailHandler, GetUserByIdHandler
├── categories/
│   ├── categories.module.ts   # CqrsModule
│   ├── categories.controller.ts  # CRUD /categories — защищён JwtAuthGuard
│   ├── categories.service.ts
│   ├── contracts/             # 5 команд/запросов + index.ts
│   ├── commands/              # create, update, delete handlers
│   ├── queries/               # getAll, getById handlers
│   └── dto/                   # CreateCategoryDtoImpl, UpdateCategoryDtoImpl
├── transactions/
│   ├── transactions.module.ts # CqrsModule
│   ├── transactions.controller.ts  # CRUD /transactions — защищён JwtAuthGuard
│   ├── transactions.service.ts
│   ├── contracts/             # 5 команд/запросов + index.ts
│   ├── commands/              # create, update, delete handlers
│   ├── queries/               # getAll (с фильтром month/year), getById handlers
│   └── dto/                   # CreateTransactionDtoImpl, UpdateTransactionDtoImpl, ListTransactionsQueryDto
└── expenses/                  # Устаревший модуль (заглушка), будет удалён
    ├── expenses.module.ts
    ├── expenses.controller.ts # GET /expenses
    └── expenses.service.ts    # findAll() без авторизации
```

## CQRS-паттерн

Каждый доменный модуль (categories, transactions, users) следует одной структуре:

```
contracts/
  create-foo.command.ts   # class CreateFooCommand { constructor(...) {} }
  get-foo.query.ts        # class GetFooQuery { constructor(...) {} }
  index.ts                # barrel-реэкспорт всех contracts
commands/
  create-foo.handler.ts   # @CommandHandler(CreateFooCommand) implements ICommandHandler
queries/
  get-foo.handler.ts      # @QueryHandler(GetFooQuery) implements IQueryHandler
```

Контроллер использует `CommandBus.execute()` и `QueryBus.execute()` напрямую — сервис используется только как фасад для сложной логики (auth). Хэндлеры регистрируются в массиве `providers` модуля.

## Авторизация

- Все бизнес-endpoints (`/categories`, `/transactions`) защищены `@UseGuards(JwtAuthGuard)`.
- `@CurrentUser()` извлекает `JwtUser` (`{ userId, email }`) из `request.user`, заполненного `JwtStrategy`.
- `JWT_SECRET` и `JWT_EXPIRES_IN` читаются через `ConfigService` — не захардкоживать в коде.
- `/auth/register` и `/auth/login` открытые (без guard).

## Схема базы данных (`prisma/schema.prisma`)

| Модель | Ключевые поля |
|---|---|
| `User` | `id` (cuid), `email` (unique), `name`, `passwordHash` |
| `Category` | `id`, `name`, `color`, `icon`, `userId` → User; уникальность `[userId, name]` |
| `Transaction` | `id`, `amount` (Decimal 12,2), `type` (income/expense), `date`, `categoryId?`, `userId` |
| `Expense` | Устаревшая модель без привязки к User, будет удалена |

Индексы: `Transaction` — `[userId, date]`, `[categoryId]`; `Category` — `[userId]`.

После изменения схемы:
1. `npm run prisma:migrate` — создаёт SQL-миграцию.
2. `npm run prisma:generate` — регенерирует Prisma Client.
3. Синхронизировать типы в `packages/shared/src/types/*`.

## Конвенции DTO

- Классы DTO называются `<Action><Entity>DtoImpl` (суффикс `Impl` нужен, так как shared-пакет экспортирует одноимённые интерфейсы/типы).
- Декораторы `class-validator` + `@ApiProperty()` из `@nestjs/swagger` обязательны.
- `UpdateTransactionDtoImpl` / `UpdateCategoryDtoImpl` — все поля опциональные (`@IsOptional()`).

## Переменные окружения

```
DATABASE_URL=postgresql://user:password@localhost:5432/expense_tracker
PORT=3001
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
```

## Команды (запускать из корня репозитория)

```bash
npm run dev:backend          # nest start --watch на :3001
npm run build -w apps/backend
npm run lint -w apps/backend
npm test -w apps/backend
npm test -w apps/backend -- src/auth/auth.service.spec.ts
npm run prisma:migrate       # prisma migrate dev
npm run prisma:generate      # генерация Prisma Client
npm run prisma:studio        # GUI для БД на :5555
```
