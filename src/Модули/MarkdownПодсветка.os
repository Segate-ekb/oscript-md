// Подсветка кода BSL в браузере: тег, который подключает к странице shiki с CDN.

// Тег для страницы с HTML из Markdown: модуль загружает shiki с esm.sh и раскрашивает блоки
// кода bsl, 1c, sdbl и 1c-query, то есть код 1С и язык запросов, в цвета тем GitHub. Без
// доступа к esm.sh код остаётся обычным текстом.
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
    |import { codeToHtml } from 'https://esm.sh/shiki@4.4.3';
    |for (const code of document.querySelectorAll('pre > code.language-bsl, pre > code.language-1c, pre > code.language-sdbl, pre > code.language-1c-query')) {
    |  const lang = code.className.replace('language-', '');
    |  code.parentElement.outerHTML = await codeToHtml(code.textContent,
    |    { lang, themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: '%1' });
    |}
    |</script>", ЦветПоУмолчанию);
КонецФункции
