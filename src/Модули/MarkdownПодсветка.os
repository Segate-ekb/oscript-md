// Подсветка кода BSL в браузере: тег, который подключает к странице shiki с CDN.

// Тег для страницы с HTML из Markdown: модуль загружает shiki с esm.sh и раскрашивает блоки
// кода bsl, 1c, sdbl и 1c-query, то есть код 1С и язык запросов, в цвета светлой или тёмной
// темы GitHub. Без доступа к esm.sh код остаётся обычным текстом.
//
// Параметры:
//   Тема - Строка - "light" или "dark", как в атрибуте data-theme и в CSS color-scheme
//
// Возвращаемое значение:
//   Строка - тег <script type="module"> с кодом подсветки
Функция ТегСкрипта(Знач Тема = "light") Экспорт
    Если Тема <> "light" И Тема <> "dark" Тогда
        ВызватьИсключение СтрШаблон("Тема подсветки «%1» не поддерживается: ожидается light или dark", Тема);
    КонецЕсли;

    Возврат СтрШаблон("<script type=""module"">
    |import { codeToHtml } from 'https://esm.sh/shiki@4.4.3';
    |for (const code of document.querySelectorAll('pre > code.language-bsl, pre > code.language-1c, pre > code.language-sdbl, pre > code.language-1c-query')) {
    |  const lang = code.className.replace('language-', '');
    |  code.parentElement.outerHTML = await codeToHtml(code.textContent, { lang, theme: 'github-%1' });
    |}
    |</script>", Тема);
КонецФункции
