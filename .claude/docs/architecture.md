# Архитектура проекта

## Общая схема

```
┌─────────────────────────────────────────────────────┐
│                    Клиент (браузер)                  │
│              Next.js 14 · App Router · FSD           │
│                  :3000                               │
└────────────────────────┬────────────────────────────┘
                         │ HTTP / JSON
                         ▼
┌─────────────────────────────────────────────────────┐
│              NestJS REST API                         │
│         CQRS · Prisma · Passport JWT                 │
│                  :3001                               │
└────────────────────────┬────────────────────────────┘
                         │ TCP
                         ▼
┌─────────────────────────────────────────────────────┐
│              PostgreSQL 16 (Docker)                  │
│                  :5432                               │
└─────────────────────────────────────────────────────┘
```

Монорепо на **npm workspaces**:

| Workspace | Путь | Роль |
|---|---|---|
| `@expense-tracker/backend` | `apps/backend/` | NestJS-приложение |
| `@expense-tracker/frontend` | `apps/frontend/` | Next.js-приложение |
| `@expense-tracker/shared` | `packages/shared/` | Общие TS-типы и DTO |

---

## Backend — слои и модули

### Точка входа (`src/main.ts`)

При старте настраивает:
- `ValidationPipe` — `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true`.
- Swagger UI на `/api/docs`.
- CORS (разрешён любой origin в dev-режиме).
- Порт из `process.env.PORT` (по умолчанию 3001).

### Модули

```
AppModule (корневой)
├── ConfigModule          — глобальный, читает .env через ConfigService
├── PrismaModule          — глобальный, экспортирует PrismaService
├── UsersModule           — CQRS: CreateUser, GetUserByEmail, GetUserById
├── AuthModule            — регистрация/логин, JwtModule, JwtStrategy, JwtAuthGuard
├── CategoriesModule      — CRUD категорий пользователя
├── TransactionsModule    — CRUD транзакций + фильтрация по периоду + сводка
└── ExpensesModule        — (устаревший, без авторизации, будет удалён)
```

### CQRS-паттерн

Каждый доменный модуль (`users`, `categories`, `transactions`) строится по единой схеме:

```
<module>/
├── contracts/
│   ├── create-foo.command.ts     # class CreateFooCommand { constructor(...) }
│   ├── get-foo.query.ts          # class GetFooQuery { constructor(...) }
│   └── index.ts                  # barrel-реэкспорт
├── commands/
│   └── create-foo.handler.ts     # @CommandHandler(CreateFooCommand)
├── queries/
│   └── get-foo.handler.ts        # @QueryHandler(GetFooQuery)
├── dto/
│   └── create-foo.dto.ts         # class CreateFooDtoImpl — class-validator + @ApiProperty
├── <module>.module.ts            # imports: [CqrsModule, ...], providers: [handlers...]
├── <module>.controller.ts        # транслирует HTTP → CommandBus/QueryBus
└── <module>.service.ts           # фасад над Prisma (используется хэндлерами)
```

**Правила потока данных:**
1. HTTP-запрос попадает в **Controller**.
2. Controller создаёт объект команды/запроса и вызывает `CommandBus.execute()` / `QueryBus.execute()`.
3. **Handler** проверяет существование пользователя (через `QueryBus → GetUserByIdQuery`) и делегирует в **Service**.
4. **Service** работает с Prisma напрямую, применяет бизнес-логику и возвращает типизированный результат.

### Авторизация

```
POST /auth/login
  └─► AuthService.login()
        └─► GetUserByEmailQuery → проверка bcrypt
              └─► JwtService.sign({ sub: userId, email })
                    └─► возвращает { token, user }

GET /transactions (любой защищённый endpoint)
  └─► JwtAuthGuard (AuthGuard('jwt'))
        └─► JwtStrategy.validate(payload)
              └─► кладёт { userId, email } в request.user
                    └─► @CurrentUser() извлекает JwtUser в контроллере
```

JWT-токен передаётся в заголовке: `Authorization: Bearer <token>`.
`JWT_SECRET` и `JWT_EXPIRES_IN` — только через `ConfigService`, не хардкодить.

---

## Frontend — слои (FSD)

Feature Slice Design. Слои импортируют только из нижних:

```
app  →  features  →  entities  →  shared
```

| Слой | Путь | Содержит |
|---|---|---|
| `app` | `src/app/` | Next.js роутинг, layout, `globals.css` |
| `features` | `src/features/` | Пользовательские сценарии: `auth/` (login, register) |
| `entities` | `src/entities/` | Бизнес-сущности: `session/` (JWT в localStorage) |
| `shared` | `src/shared/` | API-клиент, shadcn/ui компоненты, утилиты |

**Запрет:** `shared` не знает о `features`; `entities` не знает о `features`. Нарушение — стоп-блокер при ревью.

Каждая фича/сущность экспортирует публичное API через `index.ts`. Внешний импорт — только через него.

### API-клиент (`shared/api/client.ts`)

`apiRequest<T>(path, options?, token?)` — обёртка над `fetch`:
- Базовый URL из `NEXT_PUBLIC_API_URL`.
- Автоматически добавляет `Content-Type: application/json` и `Authorization: Bearer`.
- При `!response.ok` бросает `ApiError(status, message)`.

### Сессия (`entities/session`)

JWT и данные пользователя хранятся в `localStorage`:
- `setSession(token, user)` — после логина/регистрации.
- `getToken()` — для передачи в `apiRequest`.
- `clearSession()` — при выходе.

---

## Shared-пакет (`@expense-tracker/shared`)

Содержит **только TypeScript-интерфейсы и типы** — без рантайм-зависимостей.
Экспортируется напрямую из `src/index.ts` без компиляции:
- Next.js транспилирует через `transpilePackages: ['@expense-tracker/shared']`.
- NestJS/ts-node читают исходники TS.

Изменение типов в shared → проверить, что собираются оба `apps/`.

---

## Конвенции именования

| Артефакт | Конвенция | Пример |
|---|---|---|
| DTO-класс (backend) | `<Action><Entity>DtoImpl` | `CreateTransactionDtoImpl` |
| CQRS-команда | `<Action><Entity>Command` | `CreateTransactionCommand` |
| CQRS-запрос | `<Action><Entity>Query` | `GetTransactionsQuery` |
| Хэндлер команды | `<Action><Entity>Handler` | `CreateTransactionHandler` |
| Файл компонента (frontend) | kebab-case | `login-form.tsx` |
| Хук (frontend) | `use-<action>.ts` | `use-login.ts` |
| React-компонент (внутри файла) | PascalCase | `LoginForm` |
