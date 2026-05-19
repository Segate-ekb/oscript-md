# oscript-md

Markdown-парсер и рендерер на чистом OneScript. Без зависимости от Markdig/.NET.

Реализуется как расширяемая архитектура с разделением на слои:

```
Markdown source → tokens / blocks / inline nodes → AST → renderers → HTML / text / JSON
```

## Установка

```
opm install oscript-md
```

или из исходников:

```
opm install --local
opm build .
```

## Использование

```bsl
HTML = Markdown.ВHTML("# Привет, мир!");
// → "<h1>Привет, мир!</h1>"

Документ = Markdown.Разобрать("# Привет");
JSON    = Markdown.ВJSON("# Привет");
Текст   = Markdown.ВТекст("# Привет");
```

С расширениями:

```bsl
Настройки = Новый MarkdownНастройки("github-like");
HTML = Markdown.ВHTML(Текст, Настройки);
```

## Тестирование

Используется фреймворк [OneUnit](https://github.com/autumn-library/oneunit).

```bash
opm install --local --dev    # установка зависимостей разработки
oscript tasks/test.os        # все тесты + JUnit-отчёты в build/reports/
```

Отдельные группы:

```bash
oscript tasks/test_unit.os         # юнит-тесты (tests/unit/)
oscript tasks/test_commonmark.os   # CommonMark conformance (tests/commonmark/)
```

### CommonMark conformance

Сьюты в `tests/commonmark/` автогенерируются Python-скриптом из официальной
спецификации:

```bash
python tools/sync-commonmark.py 0.31.2
```

Скрипт:
1. скачивает `https://spec.commonmark.org/<версия>/spec.txt` (кеширует в `.cache/`);
2. парсит примеры в JSON-дамп `tests/commonmark/.cache/spec-<версия>.json`;
3. группирует их по секциям;
4. генерирует по одному `tests/commonmark/<section-slug>.os` на секцию.

Каждый сьют:
- именуется `commonmark_<версия>_<section>` (через `&ОтображаемоеИмя`);
- содержит по одному `&Тест Процедура Пример_NNNN()` на каждый CommonMark-пример.

Список заведомо непроходящих тестов лежит в [tools/commonmark-skip.json](tools/commonmark-skip.json).
Для пропущенных примеров генерируется `&Выключен("причина")` — OneUnit помечает
их как `пропущено` и **не** проваливает CI. По мере реализации новых фич
правки вносятся в skip-list и запускается генератор повторно.

## Архитектура

- [src/ast/](src/ast/) — узлы AST (Документ, Заголовок, Параграф, Текст, ГоризонтальнаяЛиния, …)
- [src/parsing/](src/parsing/) — контекст парсинга, читатель строк, позиция
- [src/parsing/block/](src/parsing/block/) — блочные парсеры (по классу на синтаксис)
- [src/parsing/inline/](src/parsing/inline/) — inline-парсеры
- [src/rendering/](src/rendering/) — рендереры HTML/JSON/text
- [src/MarkdownРеестрКомпонентов.os](src/MarkdownРеестрКомпонентов.os) — реестр под расширения
- [src/MarkdownНастройки.os](src/MarkdownНастройки.os) — пресеты (commonmark / github-like / documentation / …)

Полное ТЗ — в [paln.md](paln.md).

## Структура каталогов

```
src/                                  — библиотека
tests/
  unit/                               — юнит-тесты (вручную)
  commonmark/<section>.os             — CommonMark conformance (генерируется)
  commonmark/.cache/                  — скачанный spec.txt + JSON-дамп
tasks/
  test.os                             — единая точка входа (unit + commonmark)
  test_unit.os                        — только юнит-тесты
  test_commonmark.os                  — только CommonMark
tools/
  sync-commonmark.py                  — генератор CommonMark-сьютов
  commonmark-skip.json                — list исключений (xfail)
build/reports/                        — JUnit XML после прогона тестов
```
