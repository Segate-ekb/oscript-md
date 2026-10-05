// Подсветка кода в браузере: тег, который подключает к странице shiki с CDN.

// Тег для страницы с HTML из Markdown: модуль загружает shiki с esm.sh и раскрашивает в цвета
// тем GitHub блоки кода на всех языках shiki, в том числе bsl и 1c (код 1С), sdbl и 1c-query
// (язык запросов), bat и sh; регистр в имени языка не важен. Блоки на незнакомых языках и без
// языка остаются обычным текстом, как и весь код без доступа к esm.sh.
//
// Параметры:
//   Тема - Неопределено, Строка - Неопределено (по умолчанию) — цвета обеих тем, браузер
//                                  выбирает по CSS color-scheme страницы; "light" или "dark" —
//                                  только светлая или только тёмная
//
// Возвращаемое значение:
//   Строка - тег <script type="module"> с кодом подсветки
Функция ТегСкрипта(Знач Тема = Неопределено) Экспорт
    Если Тема = Неопределено Тогда
        ЦветПоУмолчанию = "light-dark()";
    ИначеЕсли Тема = "light" ИЛИ Тема = "dark" Тогда
        ЦветПоУмолчанию = Тема;
    Иначе
        ВызватьИсключение СтрШаблон(
            "Тема подсветки «%1» не поддерживается: ожидается light, dark или Неопределено", Тема);
    КонецЕсли;

    Возврат СтрШаблон("<script type=""module"">
    |import { codeToHtml, bundledLanguages } from 'https://esm.sh/shiki@4.5.0';
    |for (const code of document.querySelectorAll('pre > code[class^=""language-""]')) {
    |  const lang = code.className.slice('language-'.length).toLowerCase();
    |  if (!Object.hasOwn(bundledLanguages, lang)) continue;
    |  code.parentElement.outerHTML = await codeToHtml(code.textContent,
    |    { lang, themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: '%1' });
    |}
    |</script>", ЦветПоУмолчанию);
КонецФункции
