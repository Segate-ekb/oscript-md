// Подсветка кода BSL в браузере: тег, который подключает к странице shiki с CDN.

// Тег для страницы с HTML из Markdown: модуль загружает shiki с esm.sh и раскрашивает блоки
// кода bsl, 1c, sdbl и 1c-query, то есть код 1С и язык запросов. Без доступа к esm.sh код
// остаётся обычным текстом.
//
// Возвращаемое значение:
//   Строка - тег <script type="module"> с кодом подсветки
Функция ТегСкрипта() Экспорт
    Возврат "<script type=""module"">
    |import { codeToHtml } from 'https://esm.sh/shiki@4.4.3';
    |for (const code of document.querySelectorAll('pre > code.language-bsl, pre > code.language-1c, pre > code.language-sdbl, pre > code.language-1c-query')) {
    |  const lang = code.className.replace('language-', '');
    |  code.parentElement.outerHTML = await codeToHtml(code.textContent, { lang, theme: 'github-light' });
    |}
    |</script>";
КонецФункции
