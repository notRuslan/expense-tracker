# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Статус проекта

Зависимости установлены (`node_modules/` присутствует). Prisma Client не сгенерирован, миграций нет — `apps/backend/prisma/migrations/` пуст. Перед запуском бэкенда необходимо поднять БД (`npm run db:up`), выполнить `npm run prisma:migrate` и `npm run prisma:generate`.

## Архитектура

Монорепо на **npm workspaces** (без Turborepo/Nx). Три workspace:

- **`apps/backend/`** — NestJS + Prisma + CQRS. Подробности: [`apps/backend/CLAUDE.md`](apps/backend/CLAUDE.md).
- **`apps/frontend/`** — Next.js 14 App Router + Tailwind CSS + shadcn/ui + FSD. Подробности: [`apps/frontend/CLAUDE.md`](apps/frontend/CLAUDE.md).
- **`packages/shared/`** — общие TS-типы и DTO между фронтом и бэком. Экспортируется как `@expense-tracker/shared` напрямую из `src/index.ts` (поля `main`/`types` указывают на `.ts`, без билда). Это работает потому, что Next транспилирует пакет, а Nest/`ts-node` читают исходники TS.

**Источник правды для модели данных** — `apps/backend/prisma/schema.prisma`. При изменении схемы синхронизируйте типы в `packages/shared/src/types/*`.

## Часто используемые команды

Все команды запускаются из корня репозитория.

```bash
# Локальная БД
npm run db:up           # docker compose up -d (postgres:16-alpine на :5432)
npm run db:down
npm run db:logs

# Prisma (проксируется в apps/backend)
npm run prisma:generate
npm run prisma:migrate  # prisma migrate dev — для локальной разработки
npm run prisma:studio

# Разработка
npm run dev:backend     # NestJS на :3001, Swagger на :3001/api/docs
npm run dev:frontend    # Next.js на :3000

# Сборка / линт всех workspace
npm run build
npm run lint
```

Команды для одного workspace: `npm run <script> --workspace apps/backend` (или `-w`).
Тесты бэкенда: `npm test -w apps/backend`, один файл — `npm test -w apps/backend -- path/to/file.spec.ts`.

## Конвенции окружения

- `apps/backend/.env` — `DATABASE_URL`, `PORT` (по умолчанию 3001), `JWT_SECRET`, `JWT_EXPIRES_IN` (по умолчанию `1d`). Образец в `.env.example`.
- `apps/frontend/.env` — `NEXT_PUBLIC_API_URL` (по умолчанию `http://localhost:3001`).
- Docker volume называется `pgdata`; данные не удаляются при `db:down`.

## Платформенные нюансы

Целевая ОС разработки — Windows (PowerShell). Для скриптов в `package.json` используйте кросс-платформенный синтаксис; не полагайтесь на bash-only конструкции в npm-скриптах.

## Соглашение о коммитах

Используем [Conventional Commits](https://www.conventionalcommits.org/ru/v1.0.0/).

**Формат:** `<type>(<scope>): <краткое описание>`

- Заголовок: одна строка, не более 72 символов, в повелительном наклонении, без точки в конце.
- Тело (опционально): через пустую строку, объясняет «зачем», а не «что».
- Footer (опционально): `BREAKING CHANGE: ...`, `Refs: #123`, `Co-Authored-By: ...`.

**Типы:** `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`.

**Scope** — затронутый модуль/workspace: `backend`, `frontend`, `shared`, `prisma`, `auth`, `transactions`, `categories`, `users`, `deps` и т.п.

**Правила:**
- Один коммит — одно логическое изменение.
- Перед коммитом запускать сборку (`npm run build`) и линт затронутого workspace.
- Не использовать `--no-verify` без явного указания пользователя.
- Создавать новые коммиты вместо `--amend` для уже отправленных в remote.

**Примеры:**
```
feat(transactions): add month/year filter to list endpoint
fix(auth): prevent JWT decode crash on malformed token
refactor(backend)!: replace ExpensesModule with TransactionsModule
chore(deps): bump @nestjs/cqrs to 10.2.7
docs(claude): document commit conventions
```


## Документация
После изменения методов — обновляй JSDoc.
Для DTO и контроллеров — добавляй/обновляй Swagger декораторы.
При добавлении функционала проверяй @.claude/docs/*.
Актуализируй файлы при изменении архитектуры или API.
