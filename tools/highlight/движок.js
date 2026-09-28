// Вход бандла движка: shiki с одной грамматикой BSL (вместе с вложенным языком запросов)
// и темой css-variables. Цвет токена — var(--shiki-…): значения переменных даёт лист
// поставки или сама страница потребителя.

import { codeToTokensBase, createShikiPrimitive } from '@shikijs/primitive';
import { createCssVariablesTheme } from '@shikijs/core';
import { createJavaScriptRawEngine } from '@shikijs/engine-javascript/raw';
import bsl from '@shikijs/langs-precompiled/bsl';

// строку в столько символов и длиннее грамматика не разбирает вовсе: это данные или сжатый код
const пределДлиныСтроки = 1000;
// столько миллисекунд грамматика думает над одной строкой, дальше строка докрашивается как есть
const пределВремениСтроки = 50;

// первый разбор собирает грамматику дольше предела времени строки: разогрев при загрузке
// платит эту цену сам, иначе первая строка на странице приходила бы бесцветной
const разогрев = [
	'#Использовать asserts',
	'&НаСервере',
	'Функция Сумма(Знач А = 1) Экспорт // итог',
	'	Если А > 0 И НЕ А = Неопределено Тогда',
	'		Запрос = Новый Запрос("ВЫБРАТЬ Т.Ссылка КАК С ИЗ Справочник.Т КАК Т ГДЕ Т.Д > &Д");',
	'	КонецЕсли;',
	'	Возврат \'20260927\';',
	'КонецФункции',
].join('\n');

const тема = createCssVariablesTheme();

const подсветка = createShikiPrimitive({
	themes: [тема],
	langs: [bsl],
	engine: createJavaScriptRawEngine(),
});

codeToTokensBase(подсветка, разогрев, { lang: 'bsl', theme: тема.name });

// Токены кода по строкам: строка — массив { content, color, … }. Язык — bsl либо 1c.
export function токены(код, язык) {
	return codeToTokensBase(подсветка, код, {
		lang: язык,
		theme: тема.name,
		tokenizeMaxLineLength: пределДлиныСтроки,
		tokenizeTimeLimit: пределВремениСтроки,
	});
}
