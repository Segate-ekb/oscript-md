// Скрипт подсветки для браузера: раскрашивает блоки кода bsl и 1c на странице через shiki.

import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import bsl from 'shiki/langs/bsl.mjs';
import githubLight from 'shiki/themes/github-light.mjs';

const блоки = document.querySelectorAll('pre > code.language-bsl, pre > code.language-1c');

if (блоки.length > 0) {
	const shiki = await createHighlighterCore({
		langs: [bsl],
		themes: [githubLight],
		engine: createJavaScriptRegexEngine(),
	});
	for (const код of блоки) {
		код.parentElement.outerHTML = shiki.codeToHtml(код.textContent, { lang: 'bsl', theme: 'github-light' });
	}
}
