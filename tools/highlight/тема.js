// Что тема css-variables может написать в цвет токена: цвет по умолчанию и цвет каждого
// своего правила. Набор снимается с самой темы, чтобы не разойтись с ней при обновлении shiki.

import { createCssVariablesTheme } from '@shikijs/core';

export function цветаТемы() {
	const тема = createCssVariablesTheme();
	const цвета = [тема.colors['editor.foreground'],
		...тема.tokenColors.map((правило) => правило.settings.foreground)];
	return new Set(цвета.filter(Boolean));
}
