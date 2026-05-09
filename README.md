# Expense Tracker

Fullstack-приложение для учёта личных доходов и расходов.
Монорепо на npm workspaces: NestJS-бэкенд с CQRS + Prisma, Next.js-фронтенд с FSD + shadcn/ui, общий пакет типов.

---

## Стек

| Слой | Технологии |
|---|---|
| **Backend** | NestJS 10, CQRS (`@nestjs/cqrs`), Prisma 5 (PostgreSQL), Passport JWT, Swagger |
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, shadcn/ui, react-hook-form + Zod |
| **Shared** | TypeScript-интерфейсы и DTO (`@expense-tracker/shared`) |
| **Инфраструктура** | Docker Compose (PostgreSQL 16), npm workspaces |

---

## Требования

- **Node.js** ≥ 20.10
- **npm** ≥ 10
- **Docker** (для локальной БД)

---

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Переменные окружения

**Backend** — создайте `apps/backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/expense_tracker
PORT=3001
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=1d
```

**Frontend** — создайте `apps/frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. База данных

```bash
# Запустить PostgreSQL в Docker
npm run db:up

# Применить миграции и сгенерировать Prisma Client
npm run prisma:migrate
npm run prisma:generate
```

### 4. Dev-серверы

```bash
# Backend: http://localhost:3001
npm run dev:backend

# Frontend: http://localhost:3000
npm run dev:frontend
```

Swagger UI: **http://localhost:3001/api/docs**

---

## Структура проекта

```
expense-tracker/
├── apps/
│   ├── backend/                   # NestJS-приложение
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Источник правды для модели данных
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── auth/              # Регистрация, логин, JWT-стратегия, guard
│   │       ├── users/             # CQRS-контракты и хэндлеры пользователей
│   │       ├── categories/        # CRUD категорий (только своих)
│   │       ├── transactions/      # CRUD транзакций с фильтрацией и сводкой
│   │       ├── prisma/            # PrismaService (глобальный модуль)
│   │       └── main.ts            # Точка входа: ValidationPipe, Swagger, CORS
│   │
│   └── frontend/                  # Next.js 14 App Router
│       └── src/
│           ├── app/               # Роутинг: layout, страницы, auth route group
│           ├── features/auth/     # Формы логина и регистрации (FSD)
│           ├── entities/session/  # JWT-токен в localStorage
│           └── shared/            # API-клиент, shadcn/ui компоненты, утилиты
│
└── packages/
    └── shared/                    # @expense-tracker/shared
        └── src/
            ├── types/             # Transaction, Category, User, Auth DTO
            └── index.ts           # Barrel-реэкспорт
```

---

## API — основные эндпоинты

Все эндпоинты (кроме `/auth/*`) требуют заголовка `Authorization: Bearer <token>`.

### Auth

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/auth/register` | Регистрация. Тело: `{ name, email, password }` |
| `POST` | `/auth/login` | Логин. Тело: `{ email, password }`. Возвращает `{ token }` |

### Категории

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/categories` | Список категорий текущего пользователя |
| `POST` | `/categories` | Создать категорию |
| `GET` | `/categories/:id` | Получить категорию по id |
| `PATCH` | `/categories/:id` | Обновить категорию |
| `DELETE` | `/categories/:id` | Удалить категорию (204) |

### Транзакции

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/transactions` | Список транзакций + сводка (`totalIncome`, `totalExpense`, `balance`). Query: `?month=5&year=2026` |
| `POST` | `/transactions` | Создать транзакцию |
| `GET` | `/transactions/:id` | Получить транзакцию по id |
| `PATCH` | `/transactions/:id` | Обновить транзакцию |
| `DELETE` | `/transactions/:id` | Удалить транзакцию (204) |

Полная документация с примерами запросов и схемами — **http://localhost:3001/api/docs**.

---

## Полезные команды

```bash
# БД
npm run db:up            # docker compose up -d
npm run db:down          # docker compose down
npm run db:logs          # логи postgres-контейнера
npm run prisma:studio    # GUI для БД на :5555

# Сборка и линт
npm run build            # все workspace
npm run lint             # все workspace

# Тесты
npm test -w apps/backend
npm test -w apps/backend -- src/auth/auth.service.spec.ts
```

---

## Модель данных

```
User ──< Category    (уникальность [userId, name])
User ──< Transaction
Transaction >── Category?  (categoryId опционален)
```

- `amount` хранится как `Decimal(12, 2)` — без потерь точности для денежных сумм.
- При удалении пользователя его категории и транзакции удаляются каскадно (`onDelete: Cascade`).
- При удалении категории у транзакций `categoryId` обнуляется (`onDelete: SetNull`).
