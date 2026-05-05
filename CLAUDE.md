# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Статус проекта

Каркас монорепозитория создан, **зависимости ещё не установлены** (`node_modules/` отсутствует, `package-lock.json` появится после первого `npm install`). Prisma Client не сгенерирован, миграций нет — `apps/backend/prisma/migrations/` пуст. До запуска `npm install` любые команды `npm run *` упадут.

## Архитектура

Монорепо на **npm workspaces** (без Turborepo/Nx). Три workspace:

- **`apps/backend/`** — Nest.js + Prisma. Точка входа `src/main.ts` поднимает HTTP, включает CORS, ставит глобальный `ValidationPipe` (whitelist + transform + forbidNonWhitelisted) и публикует Swagger на `/api/docs`. `AppModule` подключает `ConfigModule` (глобально), `PrismaModule` (глобальный, экспортирует `PrismaService`) и доменные модули (сейчас один — `ExpensesModule`). `PrismaService extends PrismaClient` и подключается/отключается через `OnModuleInit`/`OnModuleDestroy` — инжектится в сервисы напрямую.
- **`apps/frontend/`** — Next.js 14 App Router + Tailwind CSS + **shadcn/ui**. Алиас `@/*` → `./src/*`. `next.config.mjs` содержит `transpilePackages: ['@expense-tracker/shared']` — без этой настройки Next падает на TS-исходниках workspace-пакета. Архитектура фронтенда — **Feature Slice Design (FSD)**, см. раздел ниже.
- **`packages/shared/`** — общие TS-типы и DTO между фронтом и бэком. Экспортируется как `@expense-tracker/shared` напрямую из `src/index.ts` (поля `main`/`types` указывают на `.ts`, без билда). Это работает потому, что Next транспилирует пакет, а Nest/`ts-node` читают исходники TS.

**Источник правды для модели данных** — `apps/backend/prisma/schema.prisma` (PostgreSQL, модели `Expense` и `Category`, `Decimal(12,2)` для сумм). Типы в `packages/shared` сейчас поддерживаются вручную и должны соответствовать схеме — при изменении `schema.prisma` синхронизируйте `packages/shared/src/types/*`.

**Авторизация реализована** — бэкенд (`AuthModule`) и фронтенд (фича `features/auth`). JWT-токен и данные пользователя хранятся в `localStorage` через `entities/session`.

## Feature Slice Design (FSD) — фронтенд

`apps/frontend/src/` разбит на слои (от верхнего к нижнему по зависимостям):

```
src/
├── app/                        # Next.js App Router (роутинг, layout, globals.css)
│   └── (auth)/                 # Route group — auth-страницы без sidebar
│       ├── layout.tsx          # Центрирует карточку на экране
│       ├── login/page.tsx
│       └── register/page.tsx
├── features/                   # Пользовательские сценарии
│   └── auth/
│       ├── api/auth-api.ts     # Вызовы POST /auth/login, /auth/register
│       ├── model/              # use-login.ts, use-register.ts — хуки состояния
│       ├── ui/                 # login-form.tsx, register-form.tsx
│       └── index.ts            # Публичное API фичи
├── entities/                   # Бизнес-сущности
│   └── session/
│       ├── model/session.ts    # getToken/setSession/clearSession (localStorage)
│       └── index.ts
└── shared/                     # Переиспользуемые примитивы (без знания о домене)
    ├── api/client.ts           # Базовый fetch-обёрточник (apiRequest, ApiError)
    ├── lib/utils.ts            # cn() — утилита для Tailwind-классов
    └── ui/                     # shadcn/ui компоненты: button, input, label, card, form
```

**Правила импортов FSD:** слой может импортировать только из слоёв ниже.
`app` → `features` → `entities` → `shared`. Импорт в обратном направлении запрещён.

**shadcn/ui:** компоненты живут в `shared/ui/`, конфиг — `components.json` (aliases указывают на `@/shared/ui` и `@/shared/lib/utils`). Для добавления нового компонента: `npx shadcn@latest add <component> -c apps/frontend`.

## Часто используемые команды

Все команды запускаются из корня репозитория.

```bash
# Установка зависимостей (первый шаг — сейчас не выполнен)
npm install

# Локальная БД
npm run db:up           # docker compose up -d (postgres:16-alpine на :5432)
npm run db:down
npm run db:logs

# Prisma (проксируется в apps/backend)
npm run prisma:generate
npm run prisma:migrate  # prisma migrate dev — для локальной разработки
npm run prisma:studio

# Разработка
npm run dev:backend     # Nest на :3001, Swagger на :3001/api/docs
npm run dev:frontend    # Next на :3000

# Сборка / линт всех workspace
npm run build
npm run lint
```

Команды для одного workspace: `npm run <script> --workspace apps/backend` (или `-w`). Тесты бэкенда: `npm test -w apps/backend`, один файл — `npm test -w apps/backend -- path/to/file.spec.ts`.

## Конвенции окружения

- `apps/backend/.env` — `DATABASE_URL`, `PORT` (по умолчанию 3001). Образец в `.env.example`.
- `apps/frontend/.env` — `NEXT_PUBLIC_API_URL` (по умолчанию `http://localhost:3001`).
- Docker volume называется `pgdata`; данные не удаляются при `db:down`.

## Платформенные нюансы

Целевая ОС разработки — Windows (PowerShell). Для скриптов в `package.json` используйте кросс-платформенный синтаксис; не полагайтесь на bash-онли конструкции в npm-скриптах.

## Соглашение о коммитах

Используем [Conventional Commits](https://www.conventionalcommits.org/ru/v1.0.0/).

**Формат:** `<type>(<scope>): <краткое описание>`

- Заголовок: одна строка, не более 72 символов, в повелительном наклонении, без точки в конце.
- Тело (опционально): через пустую строку, объясняет «зачем», а не «что».
- Footer (опционально): `BREAKING CHANGE: ...`, `Refs: #123`, `Co-Authored-By: ...`.

**Типы:**
- `feat` — новая функциональность
- `fix` — исправление бага
- `refactor` — изменение кода без изменения поведения
- `perf` — оптимизация производительности
- `docs` — только документация
- `test` — добавление/правка тестов
- `chore` — служебные изменения (зависимости, конфиги, сборка)
- `build` — изменения в системе сборки
- `ci` — изменения в CI/CD
- `style` — форматирование, без изменения логики
- `revert` — откат коммита

**Scope** — затронутый модуль/workspace: `backend`, `frontend`, `shared`, `prisma`, `auth`, `transactions`, `categories`, `deps` и т.п.

**Breaking changes:** `!` после типа/scope или `BREAKING CHANGE:` в футере.

**Примеры:**
```
feat(transactions): add CQRS module with month/year aggregation
fix(auth): prevent JWT decode crash on malformed token
refactor(backend)!: replace ExpensesModule with TransactionsModule
chore(deps): bump @nestjs/cqrs to 10.2.7
docs(claude): document commit conventions
```

**Правила:**
- Один коммит — одно логическое изменение. Не смешивать `feat` и `refactor` несвязанных областей.
- Перед коммитом запускать сборку (`npm run build`) и линт затронутого workspace.
- Не использовать `--no-verify` без явного указания пользователя.
- Создавать новые коммиты вместо `--amend` для уже отправленных в remote.
