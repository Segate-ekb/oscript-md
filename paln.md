Ниже — план в формате ТЗ для AI-агента, который должен спроектировать и реализовать Markdown-библиотеку на чистом OneScript.

---

# План для AI-агента: переписывание `markdown` на чистом OneScript

## 0. Цель

Разработать библиотеку Markdown-парсинга на чистом OneScript без зависимости от C#/.NET/Markdig.

Библиотека должна уметь:

```text
Markdown source
  → tokens / blocks / inline nodes
  → AST
  → renderers
  → HTML / plain text / JSON / normalized Markdown
```

Главный принцип: не делать монолитный «парсер всего», а строить расширяемую архитектуру с отдельными парсерами для разных типов содержимого.

---

# 1. Базовая архитектура

## 1.1. Разделить парсинг на уровни

Нужно заложить минимум четыре слоя:

```text
1. Source reader / line reader
2. Block parser
3. Inline parser
4. Renderer
```

Примерная схема:

```text
MarkdownТекст
    ↓
MarkdownЧитательСтрок
    ↓
MarkdownБлочныйПарсер
    ↓
MarkdownInlineПарсер
    ↓
MarkdownДокумент / AST
    ↓
MarkdownHTMLРендерер
```

---

## 1.2. Не делать один огромный класс парсера

Парсеры нужно сразу делить на отдельные классы по типам содержимого.

Например:

```text
ПарсерЗаголовков
ПарсерПараграфов
ПарсерСписков
ПарсерЦитат
ПарсерБлокаКода
ПарсерHTMLБлоков
ПарсерГоризонтальныхЛиний
ПарсерТаблиц
ПарсерСписковЗадач
ПарсерFrontMatter
```

Для inline-разметки:

```text
ПарсерЖирногоТекста
ПарсерКурсива
ПарсерInlineКода
ПарсерСсылок
ПарсерИзображений
ПарсерАвтоссылок
ПарсерHTMLInline
ПарсерЭкранирования
ПарсерПереносовСтрок
```

Цель: каждый класс отвечает за один тип синтаксиса.

---

# 2. Контракт для блочных парсеров

Нужно ввести общий интерфейс/соглашение для блочных парсеров.

Условно:

```bsl
// Интерфейс: MarkdownБлочныйПарсер
Функция МожетРазобрать(КонтекстПарсинга, ТекущаяСтрока) Экспорт
КонецФункции

Функция Разобрать(КонтекстПарсинга) Экспорт
КонецФункции
```

Пример:

```bsl
ПарсерЗаголовков = Новый MarkdownПарсерЗаголовков();

Если ПарсерЗаголовков.МожетРазобрать(Контекст, Строка) Тогда
    Узел = ПарсерЗаголовков.Разобрать(Контекст);
КонецЕсли;
```

Контекст должен хранить:

```text
Исходные строки
Текущую позицию
Номер строки
Настройки
Список активных расширений
Ссылочные определения
Диагностику
```

---

# 3. Контракт для inline-парсеров

Inline-парсеры также должны быть отдельными.

Условно:

```bsl
// Интерфейс: MarkdownInlineПарсер
Функция МожетРазобрать(КонтекстInline, Позиция) Экспорт
КонецФункции

Функция Разобрать(КонтекстInline) Экспорт
КонецФункции
```

Inline-парсер работает внутри уже найденного блока:

```markdown
Это **важный** текст с [ссылкой](https://example.com)
```

Должен превратиться в AST:

```text
Параграф
  Текст("Это ")
  Жирный
    Текст("важный")
  Текст(" текст с ")
  Ссылка
    URL("https://example.com")
    Текст("ссылкой")
```

---

# 4. AST-модель

Нужно создать явную модель документа.

Минимальные классы:

```text
MarkdownДокумент
MarkdownУзел
MarkdownБлочныйУзел
MarkdownInlineУзел

MarkdownЗаголовок
MarkdownПараграф
MarkdownСписок
MarkdownЭлементСписка
MarkdownЦитата
MarkdownБлокКода
MarkdownГоризонтальнаяЛиния
MarkdownHTMLБлок

MarkdownТекст
MarkdownЖирный
MarkdownКурсив
MarkdownКод
MarkdownСсылка
MarkdownИзображение
MarkdownПереносСтроки
MarkdownHTMLInline
```

Каждый узел должен хранить позицию в исходнике:

```text
НачальнаяСтрока
НачальнаяКолонка
КонечнаяСтрока
КонечнаяКолонка
ИсходныйТекст
```

Это нужно для:

```text
линтинга;
понятных ошибок;
отладки;
тестов;
редакторских инструментов;
будущего formatter/normalizer.
```

---

# 5. Расширяемость

## 5.1. Расширения должны быть объектами, а не набором if-ов

Нужно заложить систему расширений.

Пример:

```bsl
Настройки = MarkdownНастройки.ПоУмолчанию();

Настройки.Расширения.Включить("tables");
Настройки.Расширения.Включить("tasklists");
Настройки.Расширения.Включить("frontmatter");
Настройки.Расширения.Отключить("raw-html");

Парсер = Новый MarkdownПарсер(Настройки);
```

Или:

```bsl
Парсер = Новый MarkdownПарсер();

Парсер.Использовать(Новый MarkdownРасширениеТаблицы());
Парсер.Использовать(Новый MarkdownРасширениеСпискиЗадач());
Парсер.Использовать(Новый MarkdownРасширениеFrontMatter());
```

---

## 5.2. Одно расширение может добавлять несколько парсеров

Например, расширение `tables` может добавлять:

```text
MarkdownПарсерТаблиц
MarkdownHTMLРендерерТаблиц
MarkdownJSONРендерерТаблиц
MarkdownПравилоЛинтингаТаблиц
```

Расширение `tasklists` может добавлять:

```text
MarkdownПарсерСписковЗадач
MarkdownInline/Block postprocessor
MarkdownHTMLРендерерСписковЗадач
```

Расширение `frontmatter` может добавлять:

```text
MarkdownПарсерYAMLFrontMatter
MarkdownМетаданныеДокумента
```

То есть расширение — это не просто флаг, а модуль, который регистрирует свои компоненты.

---

## 5.3. Контракт расширения

Примерный контракт:

```bsl
// Интерфейс: MarkdownРасширение
Функция Имя() Экспорт
КонецФункции

Процедура Зарегистрировать(Реестр) Экспорт
КонецПроцедуры
```

Пример:

```bsl
Процедура Зарегистрировать(Реестр) Экспорт

    Реестр.ДобавитьБлочныйПарсер(Новый MarkdownПарсерТаблиц());
    Реестр.ДобавитьHTMLРендерер("table", Новый MarkdownHTMLРендерерТаблиц());

КонецПроцедуры
```

---

## 5.4. Реестр компонентов

Нужен класс:

```text
MarkdownРеестрКомпонентов
```

Он должен хранить:

```text
БлочныеПарсеры
InlineПарсеры
РендерерыHTML
РендерерыText
РендерерыJSON
ПостпроцессорыAST
ПравилаЛинтинга
```

Пример:

```bsl
Реестр.ДобавитьБлочныйПарсер(Парсер);
Реестр.ДобавитьInlineПарсер(Парсер);
Реестр.ДобавитьРендерерHTML("heading", Рендерер);
Реестр.ДобавитьПостпроцессор(Постпроцессор);
```

---

# 6. Конфигурация парсера

Нужно поддержать preset-ы.

Пример:

```bsl
Настройки = MarkdownНастройки.CommonMark();
Настройки = MarkdownНастройки.Минимальные();
Настройки = MarkdownНастройки.GitHubLike();
Настройки = MarkdownНастройки.Документация();
```

Аналогичный подход используется в `markdown-it`: там есть preset-ы вроде `commonmark`, `default`, `zero`, а синтаксис можно конфигурировать и расширять правилами. `markdown-it` прямо позиционируется как CommonMark-compatible parser с возможностью добавлять и заменять правила. ([GitHub][1])

Базовые preset-ы:

```text

commonmark
  Только CommonMark-ядро.

default
  CommonMark + безопасные полезные расширения.

documentation
  CommonMark + tables + toc + frontmatter + admonitions.

github-like
  CommonMark + tables + tasklists + strikethrough + autolinks.
```

---

# 7. Базовые возможности MVP

## 7.1. Блочный синтаксис

В MVP реализовать:

````text
ATX-заголовки: #, ##, ###
Setext-заголовки
Параграфы
Пустые строки
Block quotes >
Маркированные списки -, +, *
Нумерованные списки 1., 2.
Вложенные списки
Indented code blocks
Fenced code blocks ``` и ~~~
Горизонтальные линии
Reference link definitions
````

---

## 7.2. Inline-синтаксис

В MVP реализовать:

```text
*emphasis*
_emphasis_
**strong**
__strong__
***strong emphasis***
`inline code`
[link](url)
[link](url "title")
![alt](image.png)
[link][reference]
<https://example.com>
<user@example.com>
\* escaping
hard line breaks
soft line breaks
```

---

## 7.3. Первый набор расширений

Отдельными расширениями реализовать:

```text
tables
tasklists
strikethrough
frontmatter
heading-anchors
toc
autolinks
raw-html
admonitions
```

Список расширений должен быть расширяемым: пользователь библиотеки должен иметь возможность написать свое расширение, зарегистрировать несколько блочных/inline-парсеров и включать/отключать их при конфигурировании парсера
надо продумать контракт, а так-же возможные конфликты(надо подумать про приоритеты парсеров, например, если есть расширение для таблиц, то его парсер должен срабатывать до парсера параграфов).

---

# 8. Рендереры

## 8.1. HTML

Основной рендерер:

```bsl
HTML = Markdown.ВHTML(Текст);
```

И через AST:

```bsl
Документ = Markdown.Разобрать(Текст);
HTML = MarkdownHTMLРендерер.Отрендерить(Документ);
```

HTML-рендерер должен поддерживать:

```text
экранирование HTML;
безопасный режим;
запрет raw HTML по умолчанию;
настройку CSS-классов;
heading id;
rel="noopener noreferrer";
target="_blank" для внешних ссылок;
санитизацию URL.
```

---

## 8.2. Plain text

```bsl
Текст = Markdown.ВТекст(ТекстMarkdown);
```

Нужно для:

```text
Telegram;
email;
логов;
changelog;
preview.
```

---

## 8.3. JSON AST

```bsl
JSON = Markdown.ВJSON(ТекстMarkdown);
```

Нужно для:

```text
тестирования;
интеграций;
отладки;
snapshot-тестов.
```

---

## 8.4. Markdown normalizer

```bsl
Нормализованный = Markdown.Нормализовать(ТекстMarkdown);
```

Возможности:

```text
нормализация заголовков;
нормализация списков;
выравнивание таблиц;
удаление лишних пустых строк;
единый стиль fenced code;
единый стиль emphasis/strong;
```

---

# 10. Тестирование Markdown-спеки

Это ключевой блок. Для Markdown-парсера тесты не должны быть «после реализации». Тестирование нужно строить первым.

## 10.1. Главный источник тестов — CommonMark spec

CommonMark — это формализованная спецификация Markdown с набором conformance-тестов. Репозиторий `commonmark-spec` содержит саму спецификацию, инструменты для запуска тестов и reference implementations на C и JavaScript. ([GitHub][2])

В спецификацию встроены сотни примеров, которые служат conformance-тестами. Официальный runner запускается так:

```bash
python3 test/spec_tests.py --program $PROG
```

А сами тесты можно выгрузить в JSON:

```bash
python3 test/spec_tests.py --dump-tests
```

Формат теста:

```json
{
  "markdown": "Foo\n Bar\n---\n",
  "html": "<h2>Foo\n Bar</h2>\n",
  "section": "Setext headings",
  "number": 65
}
```

Это прямо описано в README `commonmark-spec`. ([GitHub][2])

Последняя опубликованная версия CommonMark spec на момент проверки — `0.31.2` от `2024-01-28`; на сайте спецификации доступны test cases для версий, включая `0.31.2`, `0.30`, `0.29` и более старые. ([CommonMark Spec][3])

---

## 10.2. Как встроить CommonMark tests в OneScript-проект

Необходимо использовать oneunit для запуска тестов.
сконвертировать CommonMark spec tests в JSON fixtures;
написать  test.os который будет запускать тесты.
Нужно добавить в репозиторий каталог:

```text
tests/
  commonmark/
    spec-0.31.2.json
    commonmark-runner.os
  fixtures/
  snapshots/
```

Пайплайн:

```text
1. Взять CommonMark spec tests.
2. Сохранить их как JSON fixture.
3. Для каждого теста:
   - взять поле markdown;
   - прогнать через Markdown.ВHTML();
   - сравнить с expected html;
   - при ошибке вывести section, number, markdown, expected, actual.
```

Пример результата ошибки:

```text
FAILED CommonMark #65 [Setext headings]

Input:
Foo
 Bar
---

Expected:
<h2>Foo
 Bar</h2>

Actual:
<p>Foo
 Bar</p>
<hr />
```

---

## 10.3. Не пытаться пройти все тесты сразу

CommonMark test suite большой. Например, `commonmark.json` показывает CommonMark examples как plain objects и в примере README видно `... 622 more items`, то есть всего около 627 тестовых примеров в этой версии пакета. ([GitHub][4])

Нужно идти по секциям.

Порядок реализации и тестирования:

```text
1. Tabs
2. Precedence
3. Thematic breaks
4. ATX headings
5. Setext headings
6. Indented code blocks
7. Fenced code blocks
8. HTML blocks
9. Link reference definitions
10. Paragraphs
11. Blank lines
12. Block quotes
13. List items
14. Lists
15. Inlines
16. Backslash escapes
17. Entity and numeric character references
18. Code spans
19. Emphasis and strong emphasis
20. Links
21. Images
22. Autolinks
23. Raw HTML
24. Hard line breaks
25. Soft line breaks
```

Для MVP можно завести статусную таблицу:

```text
Section                       Status
----------------------------  --------
Tabs                          pass
Thematic breaks               pass
ATX headings                  pass
Setext headings               partial
Fenced code blocks            pass
Lists                         fail
Emphasis and strong emphasis  fail
Links                         partial
```

---

## 10.4. Ввести expected failures

На ранних этапах нужно честно маркировать тесты, которые еще не должны проходить. эти сьюты или отдельные тесты можно выключать прочитай доку oneunit.

Например:

```json
{
  "number": 350,
  "section": "Emphasis and strong emphasis",
  "status": "xfail",
  "reason": "Inline emphasis parser not implemented yet"
}
```


---

## 10.5. Сравнение HTML должно быть аккуратным

Markdown-рендереры могут отличаться мелочами:

```text
<hr />
<hr>
порядок атрибутов;
лишние переводы строк;
экранирование;
пробелы внутри HTML.
```

Для CommonMark conformance лучше сначала сравнивать строго, байт-в-байт, потому что спецификация ожидает конкретный HTML.

Но дополнительно можно добавить нормализатор HTML для внутренних тестов:

```text
строгое сравнение — для CommonMark;
нормализованное сравнение — для собственных расширений;
DOM-like сравнение — если появится HTML-парсер/нормализатор.
```

---

# 11. Дополнительные test suites и источники

## 11.1. `commonmark.json`

`commonmark.json` — удобный npm-пакет/репозиторий, который экспортирует CommonMark examples как JSON-объекты. Он прямо позиционируется как пакет для тех, кто строит Markdown parser. Структура объекта: `markdown`, `html`, `section`. ([GitHub][4])

Его удобно использовать, если не хочется каждый раз генерировать JSON из официальной спеки.

---

## 11.2. `commonmark-spec`

Основной источник истины.

Использовать:

```text
spec.txt / spec.html как документацию;
spec_tests.py как эталонный runner;
--dump-tests для генерации JSON.
```

Важно зафиксировать версию спеки, например:

```text
CommonMark 0.31.2
```

Не подтягивать HEAD без контроля, иначе внезапно изменятся ожидаемые результаты.

---

## 11.3. `cmark` как reference implementation

`cmark` — C reference implementation CommonMark. Он парсит CommonMark в AST, позволяет манипулировать AST и рендерить в HTML, groff man, LaTeX, CommonMark или XML representation of AST. Также у него есть CLI. ([GitHub][5])

Его можно использовать как внешний oracle:

```bash
cmark input.md > expected.html
```

Или для сложных спорных кейсов:

```text
наш HTML сравнить с cmark HTML;
наш AST концептуально сравнить с cmark XML;
проверить поведение на больших/патологических входах.
```

`cmark` также заявляет прохождение всех CommonMark conformance tests и fuzz-тестирование, включая патологические случаи с глубокой вложенностью. ([GitHub][5])

---

## 11.4. `markdown-it` / `markdown-it-py` как пример архитектуры

`markdown-it` полезен не столько как test suite, сколько как архитектурный ориентир: он поддерживает CommonMark, расширения, плагины, включение/отключение правил и безопасное поведение по умолчанию. ([GitHub][1])

`markdown-it-py` также декларирует baseline parsing по CommonMark, возможность добавлять/заменять правила, pluggable extensions и настройку безопасности. ([GitHub][6])

Из него стоит взять идею:

```text
preset + registry + rules + plugins
```

То есть:

```bsl
MarkdownПарсер("commonmark")
    .Использовать(РасширениеFrontMatter)
    .Использовать(РасширениеFootnotes)
    .Включить("table")
```

---

## 11.5. MyST Parser как пример структуры тестов

В MyST Parser тесты организованы иерархически:

```text
tests/test_commonmark — CommonMark test set;
tests/test_renderers — проверка преобразования Markdown AST в целевой AST;
tests/test_sphinx — интеграционные тесты сборки Sphinx-проекта;
documentation build tests.
```

Это хорошая модель для нашей библиотеки. ([MyST Parser][7])

Для OneScript-проекта аналог:

```text
tests/commonmark        — тесты спеки;
tests/renderers/html    — HTML rendering;
tests/renderers/text    — plain text rendering;
tests/ast               — AST snapshots;
tests/extensions        — расширения;
tests/cli               — CLI;
tests/performance       — производительность;
tests/security          — XSS / unsafe URL / raw HTML;
```

---

# 12. Собственная тестовая стратегия

## 12.1. Пирамида тестов

Нужны такие уровни:

```text
1. Unit-тесты отдельных парсеров
2. Unit-тесты inline-парсеров
3. AST snapshot-тесты
4. HTML renderer tests
5. CommonMark conformance tests
6. Extension tests
7. Security tests
8. Regression tests
9. Performance tests
10. Fuzz/property-like tests
```

---

## 12.2. Unit-тесты блочных парсеров

Пример:

```markdown
# Заголовок
```

Ожидаемый AST:

```json
{
  "type": "document",
  "children": [
    {
      "type": "heading",
      "level": 1,
      "children": [
        {
          "type": "text",
          "value": "Заголовок"
        }
      ]
    }
  ]
}
```

Проверять:

```text
тип узла;
уровень заголовка;
дочерние inline-узлы;
позиции строк/колонок;
исходный текст узла.
```

---

## 12.3. Unit-тесты inline-парсеров

Пример:

```markdown
Это **важно** и `код`.
```

Ожидаемые inline-узлы:

```text
Текст("Это ")
Жирный
  Текст("важно")
Текст(" и ")
Код("код")
Текст(".")
```

---

## 12.4. Snapshot-тесты AST

Для AST удобно хранить эталонный JSON.

```text
tests/snapshots/heading-001.json
tests/snapshots/list-nested-001.json
tests/snapshots/link-reference-001.json
```

При изменении парсера snapshot покажет, что именно поменялось.

---

## 12.5. Тесты HTML-рендерера

Не смешивать «парсинг» и «рендеринг» везде.

Нужны отдельные тесты:

```text
AST → HTML
```

Например:

```bsl
Документ = Новый MarkdownДокумент();
Документ.Добавить(Новый MarkdownЗаголовок(1, "Привет"));

HTML = Рендерер.Отрендерить(Документ);
```

Ожидание:

```html
<h1>Привет</h1>
```

Так легче понять, где ошибка:

```text
в парсере;
в AST;
в HTML-рендерере.
```

---

## 12.6. Тесты расширений

Каждое расширение тестируется отдельно.

Пример структуры:

```text
tests/extensions/tables/
  table-basic.md
  table-alignment.md
  table-invalid.md

tests/extensions/tasklists/
  checked.md
  unchecked.md
  nested.md

tests/extensions/frontmatter/
  yaml-basic.md
  yaml-invalid.md
  no-frontmatter.md
```

Для каждого расширения нужны тесты:

```text
расширение выключено — синтаксис остается обычным Markdown;
расширение включено — синтаксис превращается в нужные узлы;
рендеринг в HTML;
AST snapshot;
ошибочные/пограничные случаи.
```

Очень важный сценарий:

```bsl
Настройки.Расширения.Отключить("tables");
```

Тогда:

```markdown
| A | B |
|---|---|
| 1 | 2 |
```

не должен превращаться в таблицу, а должен остаться параграфом.

---

## 12.7. Тесты порядка расширений

Так как расширений может быть несколько, нужно проверять порядок.

Например:

```text
frontmatter должен срабатывать только в начале документа;
tables должны срабатывать до paragraph parser;
tasklists должны модифицировать list item;
admonitions должны срабатывать до blockquote/paragraph;
raw html должен зависеть от safe mode.
```

Нужен механизм приоритетов:

```bsl
Реестр.ДобавитьБлочныйПарсер(Парсер, Приоритет);
```

Пример приоритетов:

```text
1000 FrontMatter
900  FencedCode
850  HTMLBlock
800  Heading
700  ThematicBreak
600  BlockQuote
500  List
400  Table
100  Paragraph
```

---

## 12.8. Regression-тесты

Каждый найденный баг должен превращаться в тест.

Структура:

```text
tests/regression/
  issue-001-emphasis-in-link.md
  issue-002-nested-list-code-block.md
  issue-003-russian-heading-anchor.md
```

Правило для агента:

```text
Если исправляешь баг — сначала добавь падающий тест, потом исправляй код.
```

---

## 12.9. Security-тесты

Обязательные кейсы:

```markdown
[click](javascript:alert(1))
[click](JaVaScRiPt:alert(1))
[click](data:text/html,<script>alert(1)</script>)
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<a href="javascript:alert(1)">x</a>
```

Проверять режимы:

```text
safe mode on;
safe mode off;
raw html enabled;
raw html disabled;
sanitize links enabled;
sanitize links disabled.
```

По умолчанию библиотека должна быть безопасной.

---

## 12.10. Performance-тесты

Нужны тесты на:

```text
большой README;
большой changelog;
глубоко вложенные blockquotes;
глубоко вложенные списки;
тысячи незакрытых скобок;
тысячи звездочек emphasis;
длинные строки без пробелов;
много reference links.
```

Цель: не допустить экспоненциального поведения.

Пример опасных входов:

```markdown
[[[[[[[[[[[[[[[[[[[[[[[[[[[[[
*****************************
>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
```

`cmark` отдельно отмечает robustness и тесты на патологические случаи, которые приводят многие Markdown-парсеры к сильному замедлению. ([GitHub][5])

---

# 13. Definition of Done для MVP

MVP считается готовым, если:

```text
1. Есть чистая OneScript-реализация без C#/.NET.
2. Есть AST-модель.
3. Блочные и inline-парсеры разделены по классам.
4. Есть реестр парсеров.
5. Есть механизм расширений.
6. Расширения можно включать/выключать через настройки.
7. Есть HTML-рендерер.
8. Есть JSON AST renderer.
9. Есть CommonMark test runner.
10. Зафиксирована версия CommonMark spec.
11. Проходят выбранные секции CommonMark.
12. Непройденные секции помечены как xfail/skip с причиной.
13. Есть отдельные тесты расширений.
14. Есть security-тесты.
15. Есть regression-тесты.
```

---

# 14. Рекомендуемый порядок работы для агента

## Этап 1. Каркас проекта

Создать структуру:

```text
src/
  Markdown.os
  MarkdownПарсер.os
  MarkdownНастройки.os
  MarkdownРеестрКомпонентов.os

  ast/
    MarkdownДокумент.os
    MarkdownУзел.os
    MarkdownЗаголовок.os
    MarkdownПараграф.os
    ...

  parsing/
    MarkdownКонтекстПарсинга.os
    MarkdownЧитательСтрок.os
    MarkdownБлочныйПарсер.os
    MarkdownInlineПарсер.os

  parsing/block/
    MarkdownПарсерЗаголовков.os
    MarkdownПарсерПараграфов.os
    MarkdownПарсерСписков.os
    ...

  parsing/inline/
    MarkdownПарсерТекста.os
    MarkdownПарсерЖирного.os
    MarkdownПарсерКурсива.os
    MarkdownПарсерСсылок.os
    ...

  rendering/
    MarkdownHTMLРендерер.os
    MarkdownJSONРендерер.os
    MarkdownТекстовыйРендерер.os

  extensions/
    MarkdownРасширение.os
    MarkdownРасширениеТаблицы.os
    MarkdownРасширениеСпискиЗадач.os
    ...

tests/
  commonmark/
  unit/
  ast/
  renderers/
  extensions/
  security/
  regression/
```

---

## Этап 2. CommonMark test runner

До полноценной реализации сделать runner, который умеет:

```text
читать JSON fixtures;
прогонять markdown через Markdown.ВHTML();
сравнивать expected/actual;
фильтровать по section;
фильтровать по number;
учитывать xfail;
печатать отчет.
```

Пример CLI:

```bash
oscript tests/commonmark/run.os --section "ATX headings"
oscript tests/commonmark/run.os --number 65
oscript tests/commonmark/run.os --all
```

---

## Этап 3. AST и базовый HTML renderer

Сначала сделать AST и рендерер вручную, без сложного парсинга.

Тест:

```bsl
Документ = Новый MarkdownДокумент();
Документ.Добавить(Новый MarkdownЗаголовок(1, "Привет"));

Ожидаем:
<h1>Привет</h1>
```

---

## Этап 4. Блочный парсер

Реализовать по секциям:

```text
Blank lines
Paragraphs
ATX headings
Setext headings
Thematic breaks
Indented code
Fenced code
Block quotes
Lists
```

После каждого типа — прогнать соответствующие CommonMark tests.

---

## Этап 5. Inline-парсер

Реализовать:

```text
Text
Escapes
Code spans
Emphasis
Strong
Links
Images
Autolinks
Line breaks
```

Особое внимание уделить emphasis/strong: это одна из самых сложных частей Markdown.

---

## Этап 6. Расширения

Добавить расширения:

```text
tables
tasklists
strikethrough
frontmatter
heading-anchors
toc
```

Каждое расширение должно подключаться отдельно:

```bsl
Настройки.Расширения.Включить("tables");
```

И отключаться:

```bsl
Настройки.Расширения.Отключить("tables");
```

---

## Этап 7. Безопасность

Добавить:

```text
экранирование HTML;
safe mode;
sanitize URL;
raw HTML policy;
security test suite.
```

---

---

# 15. Итоговая формулировка задачи для AI-агента

Можно дать агенту такую задачу:

```text
Разработай библиотеку Markdown для OneScript на чистом OneScript. Используемые компоненты определи самостоятельно.

Не используй C#/.NET/Markdig.

Архитектура должна быть модульной:
- отдельные классы для блочных парсеров;
- отдельные классы для inline-парсеров;
- AST-модель;
- отдельные рендереры;
- реестр компонентов;
- расширяемая система расширений.

Список расширений не должен быть захардкоженным.
Расширение должно иметь возможность зарегистрировать один или несколько:
- блочных парсеров;
- inline-парсеров;
- HTML-рендереров;
- postprocessor-ов AST;
- правил линтинга.

Расширения должны включаться и выключаться при конфигурировании парсера.

Сначала построй тестовую инфраструктуру:
- подключи CommonMark spec tests;
- зафиксируй версию спеки, например 0.31.2;
- сделай runner для JSON fixtures;
- добавь фильтрацию по section и number;
- добавь подробный diff expected/actual.

После этого реализуй парсер по секциям CommonMark, начиная с простых блочных элементов и постепенно переходя к inline-разметке.

Для каждого нового типа синтаксиса:
1. Добавь unit-тесты парсера.
2. Добавь AST snapshot-тесты.
3. Добавь HTML renderer-тесты.
4. Включи соответствующую секцию CommonMark tests.
5. Добавь regression-тесты на найденные баги.

MVP должен включать:
- Markdown → HTML;
- Markdown → AST;
- Markdown → JSON AST;
- heading;
- paragraph;
- blockquote;
- lists;
- fenced code;
- inline code;
- emphasis;
- strong;
- links;
- images;
- escaping;
- tables как расширение;
- tasklists как расширение;
- frontmatter как расширение;
- safe HTML mode.
```

Главная мысль: начинать нужно не с «написать парсер», а с **тестовой рамки CommonMark + расширяемой архитектуры**, иначе почти гарантированно получится монолит, который будет сложно довести до корректного Markdown-поведения.

[1]: https://github.com/markdown-it/markdown-it "GitHub - markdown-it/markdown-it: Markdown parser, done right. 100% CommonMark support, extensions, syntax plugins & high speed · GitHub"
[2]: https://github.com/commonmark/commonmark-spec "GitHub - commonmark/commonmark-spec: CommonMark spec, with reference implementations in C and JavaScript · GitHub"
[3]: https://spec.commonmark.org/ "CommonMark Spec"
[4]: https://github.com/wooorm/commonmark.json "GitHub - wooorm/commonmark.json: CommonMark test spec in JSON · GitHub"
[5]: https://github.com/commonmark/cmark "GitHub - commonmark/cmark: CommonMark parsing and rendering library and program in C · GitHub"
[6]: https://github.com/executablebooks/markdown-it-py "GitHub - executablebooks/markdown-it-py: Markdown parser, done right. 100% CommonMark support, extensions, syntax plugins & high speed. Now in Python! · GitHub"
[7]: https://myst-parser.readthedocs.io/en/latest/develop/test_infrastructure.html "Testing Infrastructure"
