// Собранный скрипт подсветки на странице с HTML из Markdown раскрашивает блоки bsl и 1c
// и не даёт чужому коду подвесить вкладку.

import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

const скрипт = readFileSync(new URL('../../src/highlight/oscript-md-highlight.js', import.meta.url), 'utf8');
let запусков = 0;

// Страница с этим телом после скрипта подсветки. data:-адрес исполняет скрипт модулем, import
// дожидается конца подсветки, а номер запуска в адресе делает каждый запуск новым модулем
async function страницаПослеПодсветки(тело) {
	const { document } = parseHTML(`<html><body>${тело}</body></html>`);
	globalThis.document = document;
	запусков += 1;
	await import('data:text/javascript;base64,' + Buffer.from(`${скрипт}\n// ${запусков}`).toString('base64'));
	return document;
}

let страница;

before(async () => {
	страница = await страницаПослеПодсветки(`
<pre><code class="language-bsl">Процедура Тест() Экспорт
КонецПроцедуры</code></pre>
<pre><code class="language-1c">Возврат Истина;</code></pre>
<pre><code class="language-js">const а = 1;</code></pre>`);
});

test('блоки bsl и 1c раскрашены, текст кода не изменился', () => {
	const блоки = страница.querySelectorAll('pre.shiki');

	assert.equal(блоки.length, 2);
	assert.equal(блоки[0].textContent, 'Процедура Тест() Экспорт\nКонецПроцедуры');
	assert.equal(блоки[1].textContent, 'Возврат Истина;');
});

test('ключевое слово и имя процедуры раскрашены по-разному', () => {
	const цвет = (слово) => [...страница.querySelectorAll('pre.shiki span[style]')]
		.find((токен) => токен.textContent.trim() === слово)?.getAttribute('style');

	assert.ok(цвет('Процедура'));
	assert.notEqual(цвет('Процедура'), цвет('Тест'));
});

test('блоки других языков не тронуты', () => {
	assert.ok(страница.querySelector('pre > code.language-js'));
});

test('длинные строки чужого README не держат вкладку, текст кода цел', async () => {
	// каждую такую строку shiki без предела разбирает полсекунды
	const код = Array(4).fill('а,'.repeat(1000)).join('\n');

	const начало = performance.now();
	const длинныеСтроки = await страницаПослеПодсветки(`<pre><code class="language-bsl">${код}</code></pre>`);
	const длительность = performance.now() - начало;

	assert.ok(длительность < 1000, `подсветка шла ${Math.round(длительность)} мс`);
	assert.equal(длинныеСтроки.querySelector('pre.shiki').textContent, код);
});

test('код сверх 25 000 символов на страницу остаётся текстом', async () => {
	const блокВТысячуСимволов = `<pre><code class="language-bsl">${'а = 10;\n'.repeat(125)}</code></pre>`;

	const сорокБлоков = await страницаПослеПодсветки(блокВТысячуСимволов.repeat(40));

	assert.equal(сорокБлоков.querySelectorAll('pre.shiki').length, 25);
	assert.equal(сорокБлоков.querySelectorAll('pre > code.language-bsl').length, 15);
});
