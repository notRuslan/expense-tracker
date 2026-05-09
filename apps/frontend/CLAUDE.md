# Frontend — CLAUDE.md

Next.js 14 App Router приложение с Tailwind CSS, shadcn/ui и Feature Slice Design (FSD).

## Стек

| Пакет | Роль |
|---|---|
| `next@14` | Фреймворк, App Router |
| `tailwindcss` + `tailwindcss-animate` | Стили |
| `shadcn/ui` (radix-ui + cva) | UI-компоненты |
| `react-hook-form` + `zod` | Формы и валидация |
| `@hookform/resolvers` | Связка zod с react-hook-form |
| `lucide-react` | Иконки |
| `@expense-tracker/shared` | Общие типы и DTO |

Алиас `@/*` → `./src/*`. `next.config.mjs` содержит `transpilePackages: ['@expense-tracker/shared']` — без этого Next падает на TS-исходниках workspace-пакета.

## Feature Slice Design (FSD)

`src/` разбит на слои (от верхнего к нижнему по зависимостям):

```
src/
├── app/                              # Next.js App Router (роутинг, layout, globals.css)
│   ├── layout.tsx                    # Корневой layout: <html lang="ru">, metadata
│   ├── page.tsx                      # Главная страница (/)
│   └── (auth)/                       # Route group — auth-страницы без sidebar
│       ├── layout.tsx                # Центрирует карточку на экране
│       ├── login/page.tsx
│       └── register/page.tsx
├── features/                         # Пользовательские сценарии
│   └── auth/
│       ├── api/auth-api.ts           # POST /auth/login, /auth/register через apiRequest
│       ├── model/use-login.ts        # Хук состояния формы логина
│       ├── model/use-register.ts     # Хук состояния формы регистрации
│       ├── ui/login-form.tsx         # Форма логина (react-hook-form + zod)
│       ├── ui/register-form.tsx      # Форма регистрации
│       └── index.ts                  # Публичное API фичи
├── entities/                         # Бизнес-сущности
│   └── session/
│       ├── model/session.ts          # getToken / setSession / clearSession (localStorage)
│       └── index.ts
└── shared/                           # Переиспользуемые примитивы (без знания о домене)
    ├── api/client.ts                 # apiRequest<T>() + class ApiError
    ├── lib/utils.ts                  # cn() — утилита для Tailwind-классов (clsx + twMerge)
    └── ui/                           # shadcn/ui компоненты
        ├── button.tsx
        ├── input.tsx
        ├── label.tsx
        ├── card.tsx
        └── form.tsx
```

**Правило импортов FSD:** слой может импортировать только из слоёв ниже.
`app` → `features` → `entities` → `shared`. Импорт в обратном направлении запрещён.

## API-клиент (`shared/api/client.ts`)

`apiRequest<T>(path, options?, token?)` — обёртка над `fetch`:
- Базовый URL берётся из `NEXT_PUBLIC_API_URL` (по умолчанию `http://localhost:3001`).
- Автоматически добавляет `Content-Type: application/json` и `Authorization: Bearer <token>`.
- При `!response.ok` бросает `ApiError(status, message)`.

## Сессия (`entities/session`)

JWT-токен и данные пользователя хранятся в `localStorage`:
- `setSession(token, user)` — сохраняет после логина/регистрации.
- `getToken()` — возвращает токен для передачи в `apiRequest`.
- `clearSession()` — при выходе из системы.

## shadcn/ui

Компоненты живут в `shared/ui/`. Конфиг — `components.json` в корне фронтенда:
- aliases указывают на `@/shared/ui` и `@/shared/lib/utils`.

Добавление нового компонента:
```bash
npx shadcn@latest add <component> -c apps/frontend
```

## Конвенции

- Файлы компонентов — kebab-case: `login-form.tsx`, не `LoginForm.tsx`.
- Хуки — `use-<action>.ts`: `use-login.ts`, `use-register.ts`.
- Каждая фича экспортирует публичное API через `index.ts` — импортировать только через него.
- Серверные компоненты Next.js — по умолчанию. `'use client'` — только когда нужны хуки/события.

## Переменные окружения

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Команды (запускать из корня репозитория)

```bash
npm run dev:frontend         # next dev -p 3000
npm run build -w apps/frontend
npm run lint -w apps/frontend
```
