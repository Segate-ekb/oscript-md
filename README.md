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

Библиотека следует стандартному соглашению OneScript об автообнаружении классов и
модулей по каталогам `Классы/` и `Модули/`. `lib.config` и кастомный
`package-loader.os` не используются. Семантическая группировка по
подпапкам (`ast/`, `rendering/`, `extensions/`, `internal/*`) сохранена за счёт
того, что каждая подпапка — самостоятельная мини-библиотека со своей парой
`Классы/` / `Модули/`, подключаемая через `#Использовать` из файлов, кому
нужны её сущности. Фасад [src/Модули/Markdown.os](src/Модули/Markdown.os)
подключает все подпапки сразу — поэтому после `#Использовать "oscript-md"`
весь набор классов готов к использованию.

### Публичный слой (доступен пользователю библиотеки)

- [src/Модули/Markdown.os](src/Модули/Markdown.os) — фасад. Основная точка входа: `Markdown.ВHTML`, `Markdown.Разобрать`, `Markdown.ВJSON`, `Markdown.ВТекст`, пресеты настроек.
- [src/Классы/MarkdownПарсер.os](src/Классы/MarkdownПарсер.os) — основной парсер (можно создавать напрямую для тонкой настройки).
- [src/Классы/MarkdownНастройки.os](src/Классы/MarkdownНастройки.os) — пресеты (commonmark / github-like / documentation / …).
- [src/Классы/MarkdownНаборРасширений.os](src/Классы/MarkdownНаборРасширений.os) — управление включёнными расширениями.
- [src/Классы/MarkdownРеестрКомпонентов.os](src/Классы/MarkdownРеестрКомпонентов.os) — реестр компонентов для пользовательских расширений.
- [src/ast/Классы/](src/ast/Классы/) — AST-узлы (`MarkdownДокумент`, `MarkdownЗаголовок`, `MarkdownПараграф`, `MarkdownПозицияВИсходнике`, …, включая GFM-узлы).
- [src/rendering/Классы/](src/rendering/Классы/) — рендереры HTML / JSON / Text.
- [src/extensions/Классы/](src/extensions/Классы/) — публичные классы расширений (tables, tasklists, strikethrough, autolinks). Подключаются через `MarkdownНаборРасширений.Включить(...)`.

### Internal-слой (детали реализации, для пользователя скрыты)

- [src/internal/parsing/Классы/](src/internal/parsing/Классы/) — контекст парсинга, читатель строк, inline-парсер.
- [src/internal/block/Классы/](src/internal/block/Классы/) — блочные парсеры по типам синтаксиса CommonMark (ATX, fenced/indented code, цитаты, списки, link reference definitions, параграфы, …).
- [src/internal/extensions/Классы/](src/internal/extensions/Классы/) — реализационные парсеры расширений (`MarkdownПарсерТаблиц`, `MarkdownПостпроцессорСпискаЗадач`).
- [src/internal/inline/Модули/](src/internal/inline/Модули/) — служебные модули. `MarkdownHTMLСущности` (lazy-кеш HTML-сущностей) + `html-entities.json`.

Internal-классы не подхватываются стандартным загрузчиком — их `Классы/` / `Модули/` лежат вне сканируемых путей. Они подключаются явно через `#Использовать` из тех файлов, кому нужны конкретные сущности (фасад тянет все, парсер — только нужные ему группы). Для рядового пользователя `#Использовать "oscript-md"` достаточно: фасад уже сам инициализирует внутреннюю инфраструктуру.

Тесты unit-уровня, которым нужен прямой доступ к internal (изолированный тест блочного парсера или контекста), подключают конкретные подпапки, например `#Использовать "../../src/internal/block"`. Тесты через публичный фасад этого не делают.

Полное ТЗ — в [paln.md](paln.md).

## Структура каталогов

```
src/
  Классы/                             — публичные core-классы (Парсер, Настройки,
                                         НаборРасширений, РеестрКомпонентов)
  Модули/                             — публичные модули (фасад Markdown)
  ast/Классы/                         — AST: документ, заголовки, параграфы, списки,
                                         GFM-узлы, позиция в исходнике
  rendering/Классы/                   — рендереры HTML / JSON / Text
  extensions/Классы/                  — публичные классы расширений (Tables, TaskLists,
                                         Strikethrough, AutoLinks)
  internal/
    parsing/Классы/                   — контекст, читатель строк, inline-парсер
    block/Классы/                     — блочные парсеры по типам синтаксиса
    extensions/Классы/                — реализация tables / tasklists
    inline/Модули/                    — MarkdownHTMLСущности + html-entities.json
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
