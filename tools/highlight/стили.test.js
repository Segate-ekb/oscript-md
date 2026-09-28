// Цвета подсветки по умолчанию: движок пишет в токен var(--shiki-…), а значение переменной
// даёт лист поставки на элементе с data-md-highlight. Светлое значение объявлено всегда;
// внутри @supports (color: light-dark(…)) та же переменная получает пару
// light-dark(светлое, тёмное), и тёмное браузер берёт, только если страница или элемент
// объявили тёмную схему через color-scheme. Необъявленную переменную браузер отбрасывает,
// и токен молча теряет цвет, поэтому набор переменных снимается с самой темы, а не списком здесь.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
import { файлСтилей } from './пути.js';
import { цветаТемы } from './тема.js';

const область = '[data-md-highlight]';
const цвет = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function переменныеТемы() {
	const имена = [...цветаТемы()].flatMap((значение) =>
		[...значение.matchAll(/var\((--[\w-]+)/g)].map((найденное) => найденное[1]));
	return [...new Set(имена)].sort();
}

// @supports, условие которого — поддержка light-dark(): внутри него стоят пары цветов
const блокПар = (узел) => узел.type === 'atrule' && узел.name === 'supports'
	&& /\blight-dark\(/i.test(узел.params);

// «light-dark(#24292e, #e1e4e8)» → ['#24292e', '#e1e4e8']; не пара двух цветов — null
function параЦветов(значение) {
	const пара = /^light-dark\(\s*([^,\s]+)\s*,\s*([^,\s)]+)\s*\)$/i.exec(значение.trim());
	return пара && цвет.test(пара[1]) && цвет.test(пара[2]) ? [пара[1], пара[2]] : null;
}

// Объявления правил самой области: светлые — на верхнем уровне листа, пары — внутри
// @supports с light-dark(). Разбирает настоящий парсер, поэтому комментарий и строка
// объявлением не станут.
function объявленияОбласти(текстЛиста) {
	const лист = postcss.parse(текстЛиста);
	return {
		светлые: объявленияПравил(лист.nodes),
		пары: объявленияПравил(лист.nodes.filter(блокПар).flatMap((блок) => блок.nodes)),
	};
}

function объявленияПравил(узлы) {
	const объявления = new Map();
	for (const узел of узлы) {
		if (узел.type !== 'rule' || !узел.selectors.some((с) => с.trim() === область)) continue;
		узел.each((объявление) => {
			if (объявление.type === 'decl') объявления.set(объявление.prop, объявление.value);
		});
	}
	return объявления;
}

const листПоставки = () => fs.readFileSync(файлСтилей, 'utf8');

test('объявление в комментарии, в строке, в чужом правиле и в чужом @-блоке объявлением не считается', () => {
	const образец = `
		/* [data-md-highlight] { --shiki-token-keyword: #d73a49; } */
		[data-md-highlight] {
			/* --shiki-token-string: #032f62; */
			content: "--shiki-token-comment: #6a737d;";
			--shiki-foreground: #24292e;
		}
		[data-md-highlight] pre { --shiki-token-constant: #005cc5; }
		@media (prefers-color-scheme: dark) { [data-md-highlight] { --shiki-token-link: #dbedff; } }
		@supports (display: grid) { [data-md-highlight] { --shiki-token-deleted: #b31d28; } }
		@supports (color: light-dark(#000, #fff)) {
			/* [data-md-highlight] { --shiki-token-keyword: light-dark(#d73a49, #f97583); } */
			[data-md-highlight] {
				content: "--shiki-token-string: light-dark(#032f62, #9ecbff);";
				--shiki-token-comment: light-dark(#6a737d, #6a737d);
			}
			[data-md-highlight] code { --shiki-token-constant: light-dark(#005cc5, #79b8ff); }
		}
	`;
	const { светлые, пары } = объявленияОбласти(образец);
	const переменные = (объявления) => [...объявления.keys()].filter((имя) => имя.startsWith('--'));

	assert.deepEqual(переменные(светлые), ['--shiki-foreground']);
	assert.deepEqual(переменные(пары), ['--shiki-token-comment']);
	assert.deepEqual(параЦветов(пары.get('--shiki-token-comment')), ['#6a737d', '#6a737d']);
	assert.equal(параЦветов('light-dark(#fff)'), null, 'одно значение — не пара');
	assert.equal(параЦветов('light-dark(red, #fff)'), null, 'пара только из цветов #…');
});

test('у каждой переменной темы есть светлое значение и пара light-dark, начатая с него', () => {
	const нужные = переменныеТемы();
	assert.ok(нужные.includes('--shiki-foreground') && нужные.includes('--shiki-token-keyword'),
		`разбор темы ослеп: ${нужные.join(', ')}`);

	const { светлые, пары } = объявленияОбласти(листПоставки());

	assert.deepEqual(нужные.filter((имя) => !цвет.test(светлые.get(имя) ?? '')), [],
		`переменные темы без светлого цвета на ${область}`);
	assert.deepEqual(нужные.filter((имя) => !параЦветов(пары.get(имя) ?? '')), [],
		`переменные темы без пары light-dark(светлое, тёмное) на ${область} в @supports`);
	assert.deepEqual(нужные.filter((имя) => параЦветов(пары.get(имя) ?? '')?.[0] !== светлые.get(имя)), [],
		'переменные, у которых светлая половина пары расходится со светлым значением');
});

// Лист подключают на чужую страницу: он не вправе красить её сам и не вправе решать за неё,
// тёмная она или светлая, — тему системы он не спрашивает, тёмное включает color-scheme
// страницы. Всё, что он делает, — даёт переменным подсветки цвета.
test('лист не красит страницу сам: только цвета переменных подсветки на её элементе', () => {
	const лист = postcss.parse(листПоставки());
	let объявлений = 0;

	лист.walkAtRules((правило) => {
		assert.ok(блокПар(правило), `лишнее правило @${правило.name} ${правило.params}`);
	});
	лист.walkRules((правило) => {
		assert.deepEqual(правило.selectors.map((с) => с.trim()), [область], `лишний селектор ${правило.selector}`);
	});
	лист.walkDecls((объявление) => {
		объявлений += 1;
		assert.match(объявление.prop, /^--shiki-/, `свойство ${объявление.prop} красит страницу потребителя`);
		assert.ok(цвет.test(объявление.value) || параЦветов(объявление.value),
			`${объявление.prop}: «${объявление.value}» — не цвет и не пара light-dark`);
	});
	assert.ok(объявлений > 0, 'в листе нет ни одного объявления');
});
