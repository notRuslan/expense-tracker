# План: модуль категорий трат

## Контекст

В бэкенде уже есть авторизация (`auth/`) и `users/`-модуль на CQRS, но нет ни JWT-гарда/декоратора `@CurrentUser`, ни модуля категорий. Текущая модель `Category` в `schema.prisma` глобальная — без `userId`/`icon` и с глобально-уникальным `name`. Нужно:

1. Привязать категории к пользователю (мульти-арендность).
2. Добавить полноценный CRUD с защитой по JWT и валидацией.
3. Реализовать связь `categories` → `users` через CQRS (QueryBus): перед операцией категория проверяет существование пользователя через `GetUserByIdQuery`.

Авторизация считается реализованной на уровне `AuthService` (логин/регистрация выдаёт токен), но `JwtStrategy`/`JwtAuthGuard`/`@CurrentUser` ещё надо добавить — это блокирует защиту контроллера.

## Чек-лист задач

### 1. Схема БД и миграция
- [ ] В `apps/backend/prisma/schema.prisma`:
  - [ ] Добавить связь `categories Category[]` в модель `User`.
  - [ ] В модели `Category`: добавить поля `userId String`, `icon String`, связь `user User @relation(... onDelete: Cascade)`.
  - [ ] Заменить `name String @unique` на `@@unique([userId, name])`, добавить `@@index([userId])`.
- [ ] Запустить `npm run prisma:migrate -- --name add_user_to_category`.
- [ ] Запустить `npm run prisma:generate`.

### 2. JWT-инфраструктура (`apps/backend/src/auth/`)
- [ ] Проверить наличие `@nestjs/passport`, `passport`, `passport-jwt`, `@types/passport-jwt` в `apps/backend/package.json`; при отсутствии — добавить.
- [ ] Создать `auth/strategies/jwt.strategy.ts`: `JwtStrategy extends PassportStrategy(Strategy)`, секрет через `ConfigService.getOrThrow('JWT_SECRET')`, `validate({ sub, email })` → `{ userId: sub, email }`.
- [ ] Создать `auth/guards/jwt-auth.guard.ts`: `class JwtAuthGuard extends AuthGuard('jwt')`.
- [ ] Создать `auth/decorators/current-user.decorator.ts`: `createParamDecorator` + интерфейс `JwtUser { userId: string; email: string }`.
- [ ] В `auth.module.ts`: добавить `PassportModule`, зарегистрировать `JwtStrategy` в `providers`, экспортировать `JwtModule` и `PassportModule`.

### 3. Расширение `users/` — `GetUserByIdQuery`
- [ ] `users/contracts/get-user-by-id.query.ts` — класс query с `id: string`, тип результата `PublicUser | null`.
- [ ] `users/queries/get-user-by-id.handler.ts` — `@QueryHandler`, делегирует в `usersService.findById`.
- [ ] В `users.service.ts` — добавить `findById(id: string)`.
- [ ] В `users.module.ts` — зарегистрировать `GetUserByIdHandler`.
- [ ] Обновить барель `users/contracts/index.ts`.

### 4. Shared-пакет
- [ ] В `packages/shared/src/category.ts`:
  - [ ] В `Category` добавить `icon: string`, `userId: string`, `createdAt: string`, `updatedAt: string`.
  - [ ] В `CreateCategoryDto` добавить `icon: string`.
  - [ ] В `UpdateCategoryDto` добавить опциональный `icon?: string`.
- [ ] Проверить ре-экспорт в `packages/shared/src/index.ts`.

### 5. Модуль категорий (`apps/backend/src/categories/`)
- [ ] DTO:
  - [ ] `dto/create-category.dto.ts` — `CreateCategoryDtoImpl` с `@IsString`, `@MinLength(1)`, `@MaxLength(64)`, `@Matches(/^#[0-9A-Fa-f]{6}$/)` для `color`, `@ApiProperty`.
  - [ ] `dto/update-category.dto.ts` — `UpdateCategoryDtoImpl extends PartialType(CreateCategoryDtoImpl)`.
- [ ] Contracts:
  - [ ] `contracts/create-category.command.ts` (`userId`, `dto`).
  - [ ] `contracts/update-category.command.ts` (`id`, `userId`, `dto`).
  - [ ] `contracts/delete-category.command.ts` (`id`, `userId`).
  - [ ] `contracts/get-categories.query.ts` (`userId`).
  - [ ] `contracts/get-category-by-id.query.ts` (`id`, `userId`).
  - [ ] `contracts/index.ts` — барель.
- [ ] Сервис `categories.service.ts`:
  - [ ] `create(userId, dto)` — Prisma create; P2002 → `ConflictException`.
  - [ ] `findAllByUser(userId)` — `findMany` с сортировкой по `name`.
  - [ ] `findOneByUser(id, userId)` — `findFirst`; null → `NotFoundException`.
  - [ ] `update(id, userId, dto)` — проверка владения + update; P2002 → `ConflictException`.
  - [ ] `delete(id, userId)` — проверка владения + delete.
- [ ] Хендлеры:
  - [ ] `commands/create-category.handler.ts` — `QueryBus.execute(GetUserByIdQuery)` → если null → `UnauthorizedException`; иначе `service.create`.
  - [ ] `commands/update-category.handler.ts` — то же + `service.update`.
  - [ ] `commands/delete-category.handler.ts` — то же + `service.delete`.
  - [ ] `queries/get-categories.handler.ts` — `service.findAllByUser`.
  - [ ] `queries/get-category-by-id.handler.ts` — `service.findOneByUser`.
- [ ] Контроллер `categories.controller.ts`:
  - [ ] `@UseGuards(JwtAuthGuard)`, `@ApiBearerAuth()`, `@ApiTags('categories')`.
  - [ ] `POST /categories`, `GET /categories`, `GET /categories/:id`, `PATCH /categories/:id`, `DELETE /categories/:id` (`@HttpCode(204)`).
  - [ ] Все методы используют `CommandBus`/`QueryBus` и `@CurrentUser()`.
- [ ] `categories.module.ts`: `imports: [CqrsModule, AuthModule, UsersModule]`, регистрация контроллера, сервиса и всех хендлеров.
- [ ] Подключить `CategoriesModule` в `app.module.ts`.

### 6. Проверка
- [ ] `npm run lint`.
- [ ] `npm test -w apps/backend`.
- [ ] `npm run db:up`, `npm run dev:backend`, открыть Swagger `:3001/api/docs`.
- [ ] Регистрация → логин → получить `token`.
- [ ] `GET /categories` без токена → **401**.
- [ ] `POST /categories { name: "Еда", color: "#FF5733", icon: "food" }` → **201**.
- [ ] Повторный POST с тем же `name` → **409**.
- [ ] POST с `color: "red"` → **400**.
- [ ] `GET /categories` → массив с одним элементом.
- [ ] `PATCH /categories/:id { icon: "burger" }` → **200**.
- [ ] `DELETE /categories/:id` → **204**, повторный → **404**.
- [ ] Второй пользователь видит пустой список и может создать `Еда` без конфликта.

## Критичные файлы

- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/app.module.ts`
- `apps/backend/src/auth/auth.module.ts` (+ новые `strategies/`, `guards/`, `decorators/`)
- `apps/backend/src/users/{users.module.ts,users.service.ts,contracts/index.ts}` + новые query/handler
- Новый каталог `apps/backend/src/categories/`
- `packages/shared/src/category.ts`, `packages/shared/src/index.ts`

## Паттерны для переиспользования

- DTO + `class-validator` + `@ApiProperty` — `apps/backend/src/auth/dto/register.dto.ts`.
- CQRS-структура (`contracts/`, `commands/`, `queries/`) — `apps/backend/src/users/`.
- Глобальный `PrismaService` инжектится напрямую — `apps/backend/src/expenses/expenses.service.ts`.
- Обработка `Prisma.PrismaClientKnownRequestError` (P2002) — `apps/backend/src/users/commands/create-user.handler.ts`.
