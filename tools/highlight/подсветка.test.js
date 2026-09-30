// Собранный скрипт подсветки на странице с HTML из Markdown раскрашивает блоки bsl и 1c.

import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

const { document } = parseHTML(`<html><body>
<pre><code class="language-bsl">Процедура Тест() Экспорт
КонецПроцедуры</code></pre>
<pre><code class="language-1c">Возврат Истина;</code></pre>
<pre><code class="language-js">const а = 1;</code></pre>
</body></html>`);

before(async () => {
	globalThis.document = document;
	// data:-адрес исполняет скрипт модулем, и import дожидается конца подсветки
	const скрипт = readFileSync(new URL('../../src/highlight/oscript-md-highlight.js', import.meta.url));
	await import('data:text/javascript;base64,' + скрипт.toString('base64'));
});

test('блоки bsl и 1c раскрашены, текст кода не изменился', () => {
	const блоки = document.querySelectorAll('pre.shiki');

	assert.equal(блоки.length, 2);
	assert.equal(блоки[0].textContent, 'Процедура Тест() Экспорт\nКонецПроцедуры');
	assert.equal(блоки[1].textContent, 'Возврат Истина;');
});

test('ключевое слово и имя процедуры раскрашены по-разному', () => {
	const цвет = (слово) => [...document.querySelectorAll('pre.shiki span[style]')]
		.find((токен) => токен.textContent.trim() === слово)?.getAttribute('style');

	assert.ok(цвет('Процедура'));
	assert.notEqual(цвет('Процедура'), цвет('Тест'));
});

test('блоки других языков не тронуты', () => {
	assert.ok(document.querySelector('pre > code.language-js'));
});
