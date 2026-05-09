# REVIEW.md

Правила code review для проекта **expense-tracker** (NestJS + CQRS + Prisma на бэкенде, Next.js 14 App Router + FSD + shadcn/ui на фронте, общий пакет `@expense-tracker/shared`).

Цель — короткий чек-лист, по которому ревьюер проходит каждый PR. Если пункт не применим — пропустить, но осознанно.

---

## 1. Общие правила (любой PR)

- [ ] Один PR — одно логическое изменение. Несвязанные правки выносить отдельно.
- [ ] Заголовок и коммиты — в формате [Conventional Commits](https://www.conventionalcommits.org/ru/v1.0.0/) (`feat(scope): ...`, `fix(scope): ...`). См. корневой `CLAUDE.md`.
- [ ] Перед merge: `npm run build` и `npm run lint` затронутого workspace проходят без ошибок.
- [ ] Нет закомментированного кода, `console.log`, отладочных принтов, TODO без тикета.
- [ ] Нет `--no-verify`, обхода хуков, отключённых тестов без причины в описании PR.
- [ ] Секреты и креды — только через переменные окружения (`.env`), не в коде и не в репозитории.
- [ ] Платформа разработки — Windows/PowerShell. Скрипты в `package.json` — кросс-платформенные (без bash-only).

## 2. Изменения модели данных (Prisma)

- [ ] Изменения только через `apps/backend/prisma/schema.prisma`. Ручная правка SQL запрещена.
- [ ] Создана миграция: `npm run prisma:migrate` (commit `apps/backend/prisma/migrations/*`).
- [ ] Выполнен `npm run prisma:generate` — Prisma Client актуален.
- [ ] Синхронизированы типы в `packages/shared/src/types/*` (источник правды для модели — `schema.prisma`).
- [ ] Для часто фильтруемых полей добавлены индексы (см. существующие: `Transaction[userId, date]`, `Category[userId]`).
- [ ] Денежные значения — `Decimal(12,2)`, не `Float`.
- [ ] Все пользовательские сущности привязаны к `userId` (исключение — устаревший `Expense`, который удаляется).

## 3. Backend (NestJS + CQRS)

### Структура модуля

- [ ] Новый доменный модуль повторяет структуру `categories` / `transactions`:
  ```
  contracts/   # *.command.ts, *.query.ts + index.ts (barrel)
  commands/    # *.handler.ts с @CommandHandler
  queries/     # *.handler.ts с @QueryHandler
  dto/         # *DtoImpl с class-validator + @ApiProperty
  *.module.ts  # импортирует CqrsModule, регистрирует handlers в providers
  *.controller.ts
  *.service.ts # фасад только для сложной логики (как в auth)
  ```
- [ ] Контроллер вызывает `CommandBus.execute()` / `QueryBus.execute()` напрямую — не оборачивает в сервис без причины.
- [ ] Все хэндлеры зарегистрированы в `providers` модуля (иначе CQRS их не найдёт).

### Авторизация

- [ ] Все бизнес-endpoints защищены `@UseGuards(JwtAuthGuard)`. Открытые — только `/auth/register`, `/auth/login`.
- [ ] `userId` берётся из `@CurrentUser()`, не из тела запроса и не из query.
- [ ] Запросы к БД фильтруют по `userId` — нет утечки чужих данных (categories/transactions других пользователей).
- [ ] `JWT_SECRET`, `JWT_EXPIRES_IN` читаются через `ConfigService`, не захардкожены.

### DTO и валидация

- [ ] DTO названы `<Action><Entity>DtoImpl` (суффикс `Impl` — потому что shared экспортирует одноимённые типы).
- [ ] Каждое поле снабжено декораторами `class-validator` (`@IsString`, `@IsNumber`, `@IsEnum`, `@IsOptional` и т.п.).
- [ ] Каждое поле снабжено `@ApiProperty()` — без этого endpoint неполноценен в Swagger.
- [ ] `Update<Entity>DtoImpl` — все поля `@IsOptional()`.
- [ ] Глобальный `ValidationPipe` уже включён (`whitelist: true, transform: true, forbidNonWhitelisted: true`) — DTO должны это учитывать.

### Тесты

- [ ] Новая бизнес-логика покрыта unit-тестами: `npm test -w apps/backend -- path/to/file.spec.ts`.
- [ ] Хэндлеры CQRS тестируются изолированно с замоканными зависимостями.
- [ ] Не мокать Prisma там, где разумнее интеграционный тест на реальную БД.

### Swagger

- [ ] Endpoint виден на `http://localhost:3001/api/docs` и корректно описывает request/response.
- [ ] Защищённые endpoints помечены `@ApiBearerAuth()`.

## 4. Frontend (Next.js 14 + FSD)

### Структура и FSD

- [ ] Новый код размещён в правильном слое: `app` → `features` → `entities` → `shared`.
- [ ] **Импорты только сверху вниз.** `shared` не знает о `features`, `entities` не знает о `features`. Нарушение — стоп-блокер.
- [ ] Каждая фича/сущность экспортирует публичное API через `index.ts`. Импорт во внешний код — только через него, не вглубь файлов.
- [ ] Нет дублирования примитивов из `shared/ui/` — переиспользовать существующие компоненты shadcn/ui.

### Именование

- [ ] Файлы компонентов — **kebab-case**: `login-form.tsx`, не `LoginForm.tsx`.
- [ ] Хуки — `use-<action>.ts`: `use-login.ts`.
- [ ] React-компоненты внутри файла — PascalCase.

### Серверные/клиентские компоненты

- [ ] Компонент **серверный по умолчанию**. `'use client'` ставится только когда реально нужны хуки, события, браузерные API.
- [ ] Не тащить тяжёлые клиентские зависимости в серверные компоненты.

### Формы и валидация

- [ ] Формы — `react-hook-form` + `zod` через `@hookform/resolvers/zod`.
- [ ] Zod-схема согласована с DTO бэкенда (типы из `@expense-tracker/shared`).
- [ ] UI ошибок использует компоненты из `shared/ui/form.tsx`.

### API и сессия

- [ ] Запросы идут через `shared/api/client.ts` (`apiRequest<T>()`), не голый `fetch`.
- [ ] Токен берётся из `entities/session` (`getToken()`), не из произвольного места в `localStorage`.
- [ ] Ошибки бэкенда обрабатываются через `ApiError` (status + message).
- [ ] Базовый URL — только из `NEXT_PUBLIC_API_URL`, не захардкожен.

### Стили

- [ ] Tailwind-классы объединять через `cn()` из `shared/lib/utils`.
- [ ] Не дублировать токены — использовать переменные темы из `globals.css` / Tailwind-конфига.
- [ ] Иконки — только `lucide-react`.

## 5. Shared-пакет (`@expense-tracker/shared`)

- [ ] Экспортируется только из `src/index.ts` (barrel). Нет билда — `main`/`types` указывают на `.ts`.
- [ ] Содержит **только типы и константы**, без рантайм-зависимостей от Nest/Next.
- [ ] При изменении типов проверены оба consumer-а: `apps/backend` и `apps/frontend` собираются.
- [ ] Не дублируются типы, уже существующие в Prisma (импортировать из shared, маппить вручную при необходимости).

## 6. Безопасность

- [ ] Пароли — только через `bcrypt`, никогда не логируются и не возвращаются в ответах.
- [ ] Нет SQL-инъекций — только Prisma API, без `$queryRawUnsafe` без явной необходимости.
- [ ] CORS, заголовки, rate-limit — не ослаблять без согласования.
- [ ] Не возвращать `passwordHash` и другие чувствительные поля наружу (фильтровать в сервисе/хэндлере).

## 7. Производительность

- [ ] Нет N+1 — использовать `include` / `select` Prisma осознанно.
- [ ] Списочные endpoints поддерживают фильтрацию/пагинацию там, где данных может быть много (см. `transactions` с `month`/`year`).
- [ ] На фронте — нет лишних client-компонентов; тяжёлые списки виртуализируются при необходимости.

## 8. Документация

- [ ] При изменении архитектуры/команд — обновлены соответствующие `CLAUDE.md` (корневой / `apps/backend` / `apps/frontend`).
- [ ] Новые env-переменные добавлены в `.env.example`.
- [ ] Описание PR объясняет **зачем**, а не только **что** (тело коммита — тоже).

---

## Стоп-блокеры (PR не мержится)

1. Утечка чужих данных (запрос без фильтра по `userId`).
2. Отсутствие миграции при изменении `schema.prisma`.
3. Захардкоженные секреты, токены, пароли.
4. Нарушение FSD-направления импортов.
5. Незащищённый бизнес-endpoint (без `JwtAuthGuard`).
6. Падает `npm run build` или `npm run lint`.
7. Использование `--no-verify` без явного указания в описании PR.


## Пропускать при ревью
- Файлы миграций Prisma (`prisma/migrations/**`)
- `package-lock.json` и другие lock-файлы
- `*.log` файлы
