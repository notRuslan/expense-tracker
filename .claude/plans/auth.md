# План: добавление авторизации (Users + Auth + CQRS)

## Контекст

В бэкенде сейчас нет понятия пользователя — есть только `Expense` и `Category`, и в `CLAUDE.md` зафиксировано, что авторизация намеренно отсутствует. Запрос пользователя:

- модуль `Users` с полями `name`, `email`, `passwordHash`;
- модуль `Auth` c JWT и эндпоинтами `register` / `login`;
- общение между модулями **только через CQRS** (`@nestjs/cqrs`) — никаких прямых импортов сервисов между `AuthModule` и `UsersModule`.

Цель — получить рабочие `POST /auth/register` и `POST /auth/login`, возвращающие JWT и публичные данные пользователя; хэш пароля никогда не утекает наружу.

## Чек-лист задач

### 0. Подготовка

- [x] Добавить зависимости в `apps/backend/package.json`: `@nestjs/cqrs`, `@nestjs/jwt`, `bcrypt`, `@types/bcrypt` (dev)
- [ ] Прописать `JWT_SECRET` и `JWT_EXPIRES_IN` в `apps/backend/.env` и `.env.example`
- [ ] `npm install` в корне (после правок package.json)

### 1. Prisma

- [x] Добавить модель `User` в `apps/backend/prisma/schema.prisma`
- [ ] `npm run prisma:generate -w apps/backend`
- [ ] `npm run prisma:migrate -w apps/backend` (имя миграции — `add_user`)

### 2. Общие типы (`packages/shared/src/`)

- [x] `types/user.ts` — интерфейс `PublicUser`
- [x] `types/auth.ts` — `RegisterDto`, `LoginDto`, `AuthResponse`
- [x] Реэкспорт из `index.ts`

### 3. UsersModule (`apps/backend/src/users/`)

- [x] `contracts/create-user.command.ts` — класс `CreateUserCommand`, тип `CreateUserResult = PublicUser`
- [x] `contracts/get-user-by-email.query.ts` — класс `GetUserByEmailQuery`, интерфейс `GetUserByEmailResult` (включает `passwordHash`)
- [x] `contracts/index.ts` — barrel: единственная точка импорта для `AuthModule`
- [x] `users.service.ts` — внутренний сервис, использует глобальный `PrismaService`
- [x] `commands/create-user.handler.ts` — `@CommandHandler(CreateUserCommand)`; на `P2002` → `ConflictException`
- [x] `queries/get-user-by-email.handler.ts` — `@QueryHandler(GetUserByEmailQuery)`
- [x] `users.module.ts` — `imports: [CqrsModule]`, `providers: [UsersService, CreateUserHandler, GetUserByEmailHandler]`

### 4. AuthModule (`apps/backend/src/auth/`)

- [x] `dto/register.dto.ts` — `class-validator`: `IsEmail`, `IsString`, `MinLength(8)` для password, `implements RegisterDto`
- [x] `dto/login.dto.ts` — `IsEmail`, `IsString`, `implements LoginDto`
- [x] `auth.service.ts` — `CommandBus` + `QueryBus` + `JwtService` + `bcrypt`; методы `register`, `login`
- [x] `auth.controller.ts` — `POST /auth/register`, `POST /auth/login`, `@ApiTags('auth')`
- [x] `auth.module.ts` — `imports: [CqrsModule, JwtModule.registerAsync(...)]`, `controllers: [AuthController]`, `providers: [AuthService]`

### 5. Регистрация модулей

- [x] Подключить `UsersModule` и `AuthModule` в `apps/backend/src/app.module.ts`

### 6. Верификация

- [ ] `npm run db:up` — поднять Postgres
- [ ] `npm run dev:backend` — Swagger на `http://localhost:3001/api/docs` показывает секцию `auth`
- [ ] `POST /auth/register` с валидным телом → `201` + `{ token, user }`, в БД `passwordHash` ≠ паролю
- [ ] Повторный `register` с тем же email → `409 Conflict`
- [ ] `POST /auth/login` с верным паролем → `200` + `{ token, user }`; токен валиден, payload содержит `sub` и `exp`
- [ ] `POST /auth/login` с неверным паролем или несуществующим email → `401` с одинаковым сообщением
- [ ] `passwordHash` не сериализуется ни в одном ответе
- [ ] Проверка изоляции CQRS: в `apps/backend/src/auth/**` нет упоминаний `UsersService`, `PrismaService`, `prisma.user`; в `apps/backend/src/users/**` — нет `AuthService`, `JwtService`, `bcrypt`

## Зависимости

```
@nestjs/cqrs        ^10
@nestjs/jwt         ^10
bcrypt              ^5
@types/bcrypt       (dev)
```

`@nestjs/passport` и `passport-jwt` пока **не нужны** — guard-ы и верификация токена не входят в задачу.

## Изменения в Prisma

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Связь `User` ↔ `Expense` сейчас не вводим.

## Структура UsersModule

Модуль ничего не экспортирует наружу — наружу видны только CQRS-handler-ы.

```
users/
  users.module.ts
  users.service.ts                     // внутренний, инжектится только в handler-ы
  contracts/
    create-user.command.ts
    get-user-by-email.query.ts
    index.ts                           // barrel — единственный путь импорта для Auth
  commands/
    create-user.handler.ts
  queries/
    get-user-by-email.handler.ts
```

`UsersService` использует глобальный `PrismaService` из `PrismaModule` (он `@Global()` — импортировать явно не надо).

Уникальность email — на уровне БД (`@unique`); в `CreateUserHandler` ловим `PrismaClientKnownRequestError` с кодом `P2002` и кидаем `ConflictException`. Без предварительных `SELECT` (race condition).

## Структура AuthModule

```
auth/
  auth.module.ts
  auth.controller.ts                   // POST /auth/register, POST /auth/login
  auth.service.ts                      // оркестратор: CommandBus/QueryBus + bcrypt + JwtService
  dto/
    register.dto.ts
    login.dto.ts
```

`AuthModule` **не импортирует** `UsersModule` и не знает про `UsersService` / `PrismaService`. Все обращения к данным пользователя — через `commandBus.execute(new CreateUserCommand(...))` и `queryBus.execute(new GetUserByEmailQuery(...))`.

```ts
@Module({
  imports: [
    CqrsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: cfg.get('JWT_EXPIRES_IN') ?? '1d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
```

Алгоритмы:

- **register**: `bcrypt.hash` (salt rounds = 10) → `CreateUserCommand` → handler возвращает `PublicUser` → `jwtService.sign({ sub, email })` → `{ token, user }`. `P2002` → `409`.
- **login**: `GetUserByEmailQuery` → если `null` или `bcrypt.compare` = false → `UnauthorizedException` (одинаковое сообщение) → `jwtService.sign` → `{ token, user }` (без `passwordHash`).

## Взаимодействие через CQRS (детально)

Граница между `AuthModule` и `UsersModule` — шина CQRS. `AuthModule` импортирует **только** классы команд/запросов и интерфейсы результатов из `users/contracts/` (barrel). Handler-ы и `UsersService` остаются скрыты, доставка — через `CommandBus`/`QueryBus`.

### Контракты

```ts
// contracts/create-user.command.ts
export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly passwordHash: string,
  ) {}
}
export type CreateUserResult = PublicUser;

// contracts/get-user-by-email.query.ts
export class GetUserByEmailQuery {
  constructor(public readonly email: string) {}
}
// Единственный «приватный» тип, покидающий UsersModule:
// passwordHash нужен Auth для bcrypt.compare.
export interface GetUserByEmailResult {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Поток register

```
AuthController.register(dto)
  └─ AuthService.register(dto)
       ├─ bcrypt.hash(dto.password)
       ├─ commandBus.execute(new CreateUserCommand(email, name, passwordHash))
       │   → CreateUserHandler → UsersService.create → prisma.user.create
       │   возвращает PublicUser
       ├─ jwtService.sign({ sub: user.id, email: user.email })
       └─ return { token, user }
```

### Поток login

```
AuthController.login(dto)
  └─ AuthService.login(dto)
       ├─ queryBus.execute(new GetUserByEmailQuery(dto.email))
       │   → GetUserByEmailHandler → UsersService.findByEmail
       │   возвращает GetUserByEmailResult | null
       ├─ если null → throw UnauthorizedException
       ├─ bcrypt.compare → если false → throw UnauthorizedException (то же сообщение)
       ├─ jwtService.sign({ sub, email })
       └─ return { token, user: stripPasswordHash(result) }
```

### Регистрация handler-ов

`CqrsModule` подхватывает handler-ы по декораторам `@CommandHandler` / `@QueryHandler` из `providers`. `AuthModule` тоже импортирует `CqrsModule` — иначе `CommandBus` / `QueryBus` не инжектятся.

### Правила, которые проверяем при ревью

- В `apps/backend/src/auth/**` нет упоминаний `UsersService`, `PrismaService`, `prisma.user`.
- В `apps/backend/src/users/**` нет упоминаний `AuthService`, `JwtService`, `bcrypt`.
- Единственный путь импорта между модулями — `apps/backend/src/users/contracts`.
- Handler-ы — единственное место, где `UsersService` инжектится; контроллеров у `UsersModule` нет.
- Хэш пароля рождается и проверяется только в `AuthService`.

## Файлы, которые меняются

- `apps/backend/prisma/schema.prisma` — модель `User`
- `apps/backend/package.json` — новые зависимости
- `apps/backend/.env` / `.env.example` — `JWT_SECRET`, `JWT_EXPIRES_IN`
- `apps/backend/src/app.module.ts` — подключение `UsersModule`, `AuthModule`
- новые: `apps/backend/src/users/**`, `apps/backend/src/auth/**`
- `packages/shared/src/types/user.ts`, `packages/shared/src/types/auth.ts`, `packages/shared/src/index.ts`

## Что **не** делаем в рамках задачи

- `JwtStrategy`, `AuthGuard`, `@CurrentUser()` — пользователь просил только `login`/`register`.
- Связь `User` ↔ `Expense` (owner) — отдельная задача.
- Refresh-токены, ролевая модель, e-mail верификация.
