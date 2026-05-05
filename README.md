# Expense Tracker

Монорепозиторий трекера расходов.

## Стек

- **Frontend** — Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend** — Nest.js + TypeScript + Swagger
- **БД / ORM** — PostgreSQL + Prisma
- **Монорепо** — npm workspaces

## Структура

```
apps/
  frontend/   # Next.js
  backend/    # Nest.js + Prisma
packages/
  shared/     # общие типы и DTO
docker-compose.yml
```

## Первый запуск

> На текущем этапе зависимости ещё не установлены. Шаги ниже — порядок последующих действий.

```bash
# 1. Установить зависимости во всех workspace
npm install

# 2. Поднять PostgreSQL
npm run db:up

# 3. Скопировать .env.example -> .env в apps/backend и apps/frontend
# 4. Применить миграции Prisma
npm run prisma:migrate

# 5. Запустить backend и frontend (в разных терминалах)
npm run dev:backend
npm run dev:frontend
```

## Скрипты

| Команда | Описание |
|---|---|
| `npm run dev:frontend` | Next.js dev server |
| `npm run dev:backend` | Nest.js dev server |
| `npm run build` | Сборка всех workspace |
| `npm run lint` | Линт всех workspace |
| `npm run db:up` / `db:down` | Запуск/остановка PostgreSQL |
| `npm run prisma:generate` | Генерация Prisma Client |
| `npm run prisma:migrate` | Применение миграций |
| `npm run prisma:studio` | Prisma Studio |
