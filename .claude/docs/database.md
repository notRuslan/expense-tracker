# База данных

ORM: **Prisma 5**. Провайдер: **PostgreSQL 16**.
Источник правды — `apps/backend/prisma/schema.prisma`.

---

## Схема связей

```
User ──< Category    (один пользователь — много категорий)
User ──< Transaction (один пользователь — много транзакций)
Category >──< Transaction  (категория опциональна у транзакции)

User удалён       → Category удалены каскадно (onDelete: Cascade)
User удалён       → Transaction удалены каскадно (onDelete: Cascade)
Category удалена  → Transaction.categoryId = null (onDelete: SetNull)
```

---

## Модели

### `User`

Учётная запись пользователя.

| Поле | Тип Prisma | DB-тип | Описание |
|---|---|---|---|
| `id` | `String` | `TEXT` | cuid, первичный ключ |
| `email` | `String` | `TEXT` | уникальный, используется для логина |
| `name` | `String` | `TEXT` | отображаемое имя |
| `passwordHash` | `String` | `TEXT` | bcrypt-хэш (10 раундов), **никогда не возвращается клиенту** |
| `createdAt` | `DateTime` | `TIMESTAMPTZ` | устанавливается автоматически |
| `updatedAt` | `DateTime` | `TIMESTAMPTZ` | обновляется Prisma автоматически (`@updatedAt`) |

Индексы: уникальный по `email`.

---

### `Category`

Категория расходов/доходов, принадлежащая конкретному пользователю.

| Поле | Тип Prisma | DB-тип | Описание |
|---|---|---|---|
| `id` | `String` | `TEXT` | cuid, первичный ключ |
| `name` | `String` | `TEXT` | название (1–64 символа) |
| `color` | `String` | `TEXT` | hex-цвет, формат `#RRGGBB` |
| `icon` | `String` | `TEXT` | строковый идентификатор иконки |
| `userId` | `String` | `TEXT` | FK → `User.id`, `onDelete: Cascade` |
| `createdAt` | `DateTime` | `TIMESTAMPTZ` | авто |
| `updatedAt` | `DateTime` | `TIMESTAMPTZ` | авто |

Индексы:
- `@@unique([userId, name])` — имя уникально в рамках одного пользователя.
- `@@index([userId])` — быстрый поиск категорий по владельцу.

---

### `Transaction`

Финансовая операция (доход или расход).

| Поле | Тип Prisma | DB-тип | Описание |
|---|---|---|---|
| `id` | `String` | `TEXT` | cuid, первичный ключ |
| `amount` | `Decimal` | `DECIMAL(12,2)` | сумма; 12 знаков до запятой, 2 после — без потерь точности |
| `type` | `TransactionType` | `TEXT` (enum) | `income` или `expense` |
| `description` | `String?` | `TEXT` | опциональный комментарий (до 255 символов) |
| `date` | `DateTime` | `TIMESTAMPTZ` | дата операции (передаётся клиентом в ISO 8601) |
| `categoryId` | `String?` | `TEXT` | FK → `Category.id`, опционально, `onDelete: SetNull` |
| `userId` | `String` | `TEXT` | FK → `User.id`, `onDelete: Cascade` |
| `createdAt` | `DateTime` | `TIMESTAMPTZ` | авто |
| `updatedAt` | `DateTime` | `TIMESTAMPTZ` | авто |

Индексы:
- `@@index([userId, date])` — фильтрация списка транзакций по периоду для конкретного пользователя.
- `@@index([categoryId])` — поиск транзакций по категории.

**Enum `TransactionType`:**
```
income   — доход
expense  — расход
```

---

### `Expense` ⚠️ устаревшая

Ранняя модель без привязки к пользователю. **Будет удалена.**
Не использовать в новом коде. Связанный `ExpensesModule` тоже устаревший.

---

## Работа с миграциями

### Изменить схему

1. Отредактировать `apps/backend/prisma/schema.prisma`.
2. Создать и применить миграцию:
   ```bash
   npm run prisma:migrate   # prisma migrate dev → создаёт SQL в migrations/
   ```
3. Регенерировать Prisma Client:
   ```bash
   npm run prisma:generate
   ```
4. Синхронизировать типы в `packages/shared/src/types/*` (если изменились публичные поля).

### Production

```bash
npm run prisma:deploy   # prisma migrate deploy — только применяет, не создаёт миграции
```

### Инструменты

```bash
npm run prisma:studio   # GUI для просмотра и редактирования данных на :5555
npm run db:up           # docker compose up -d (postgres:16-alpine на :5432)
npm run db:down         # docker compose down (данные в volume pgdata сохраняются)
npm run db:logs         # логи postgres-контейнера
```

---

## Типы в коде

Prisma генерирует типы в `@prisma/client`. В сервисах используются напрямую:

```ts
import { Prisma, Transaction as TransactionRow } from '@prisma/client';

// Денежные значения — через Prisma.Decimal:
amount: new Prisma.Decimal(dto.amount)

// Маппинг в публичный тип (Decimal → number, Date → ISO-строка):
function mapTransaction(row: TransactionRow): Transaction {
  return {
    ...row,
    amount: Number(row.amount),
    date: row.date.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
```

Публичные типы (`Transaction`, `Category`, `PublicUser`) — в `@expense-tracker/shared`.
`passwordHash` никогда не попадает в публичные типы и не возвращается клиенту.

---

## Переменные окружения

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/expense_tracker
```

Docker volume называется `pgdata` — данные сохраняются между `db:down` / `db:up`.
