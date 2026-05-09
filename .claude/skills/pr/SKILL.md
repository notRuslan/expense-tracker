---
name: pr
description: Создать Pull Request на GitHub с заданными названием и веткой.
model: sonnet
allowed-tools: Bash(git *), Bash(gh *)
user-invocable: true
argument-hint: <title> <base-branch, default main>
---

# PR Skill

Создай Pull Request на GitHub, соблюдая соглашения проекта.

## Аргументы

- $0 - название PR
- $1 - целевая ветка

## Подготовка

1. Определи base-ветку: второй аргумент `$1`, по умолчанию `main`.
2. Получи diff от базовой ветки:
   ```bash
   git diff <base>..HEAD
   ```
3. Получи список коммитов:
   ```bash
   git log <base>..HEAD --oneline
   ```

## Задача

Используя данные выше — заполни шаблон
из @template.md.
Посмотри пример хорошего PR: @examples/good-pr.md

## Создание PR

Создай PR командой:
gh pr create \
--title "$0 или сгенерированный title" \
--body "заполненный шаблон" \
--base "${ARGUMENTS:-main}"

## Правила

- Заголовок по conventional commits
- Если ветка не запушена:
  git push --set-upstream origin HEAD
