// Собранный скрипт подсветки раскрашивает на странице блоки bsl и 1c и не трогает остальные.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

test('блоки bsl и 1c раскрашены, текст кода цел, блок js не тронут', async () => {
	const { document } = parseHTML(`<html><body>
<pre><code class="language-bsl">Процедура Тест() Экспорт
КонецПроцедуры</code></pre>
<pre><code class="language-1c">Если А &lt;&gt; Б Тогда</code></pre>
<pre><code class="language-js">const а = 1;</code></pre>
</body></html>`);
	globalThis.document = document;

	// data:-адрес исполняет скрипт модулем, и import дожидается конца подсветки
	const скрипт = readFileSync(new URL('../../src/highlight/oscript-md-highlight.js', import.meta.url));
	await import('data:text/javascript;base64,' + скрипт.toString('base64'));

	const раскрашенные = [...document.querySelectorAll('pre.shiki')].map((блок) => блок.textContent);
	assert.deepEqual(раскрашенные, ['Процедура Тест() Экспорт\nКонецПроцедуры', 'Если А <> Б Тогда']);
	assert.ok(document.querySelector('pre.shiki span[style]'));
	assert.ok(document.querySelector('pre > code.language-js'));
});
