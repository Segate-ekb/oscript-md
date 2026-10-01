// Скрипт подсветки для браузера: раскрашивает блоки кода bsl и 1c на странице через shiki.

import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import bsl from 'shiki/langs/bsl.mjs';
import githubLight from 'shiki/themes/github-light.mjs';

// чужой README не держит вкладку: разбор строки дорожает быстрее её длины, поэтому длинную
// строку shiki оставляет без цвета, а код сверх запаса страницы остаётся текстом
const пределДлиныСтроки = 200;
let запасСимволов = 25000;

const блоки = document.querySelectorAll('pre > code.language-bsl, pre > code.language-1c');

if (блоки.length > 0) {
	const shiki = await createHighlighterCore({
		langs: [bsl],
		themes: [githubLight],
		engine: createJavaScriptRegexEngine(),
	});
	for (const код of блоки) {
		const текст = код.textContent;
		if (текст.length > запасСимволов) continue;
		запасСимволов -= текст.length;
		код.parentElement.outerHTML = shiki.codeToHtml(текст, {
			lang: 'bsl',
			theme: 'github-light',
			tokenizeMaxLineLength: пределДлиныСтроки,
		});
	}
}
