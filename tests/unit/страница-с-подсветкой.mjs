// Страница для подсветка-test.os: скрипт и движок пакета исполняются в node над маленьким
// DOM, где один блок BSL стоит в элементе с атрибутом, а другой — вне его. Печатает метки
// раскрашенных блоков, по одной на строку. Зависимостей нет: странице хватает самого node.
//
//   node страница-с-подсветкой.mjs <скрипт> <движок> <атрибут>

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

// движок собран с флагом регулярных выражений v: на node до 20-й версии он не загрузится,
// и тест увидел бы только «ничего не раскрашено»
if (Number(process.versions.node.split('.')[0]) < 20) {
	console.error(`движку подсветки нужен node 20+, здесь ${process.version}`);
	process.exit(1);
}

const [файлСкрипта, файлДвижка, атрибут] = process.argv.slice(2);

// без движка скрипт честно оставит код текстом, и тест увидел бы только «ничего не раскрашено»
if (!fs.existsSync(файлДвижка)) {
	console.error(`движка нет: ${файлДвижка} — его собирают npm ci && npm run build в tools/highlight`);
	process.exit(1);
}

class Текст {
	constructor(текст) {
		this.textContent = текст;
	}
}

class Элемент {
	constructor(тег, атрибуты = {}, дети = []) {
		this.тег = тег;
		this.атрибуты = атрибуты;
		this.style = {};
		this.childNodes = [];
		дети.forEach((ребёнок) => this.appendChild(ребёнок));
	}

	getAttribute(имя) {
		return Object.hasOwn(this.атрибуты, имя) ? this.атрибуты[имя] : null;
	}

	appendChild(узел) {
		const новые = узел instanceof Фрагмент ? узел.childNodes.splice(0) : [узел];
		for (const новый of новые) {
			новый.parentNode = this;
			this.childNodes.push(новый);
		}
		return узел;
	}

	get textContent() {
		return this.childNodes.map((узел) => узел.textContent).join('');
	}

	set textContent(текст) {
		this.childNodes = [];
		if (текст !== '') this.appendChild(new Текст(текст));
	}

	// скрипт спрашивает DOM двумя селекторами; незнакомый значит, что страница отстала от скрипта
	querySelectorAll(селектор) {
		const потомки = потомкиЭлемента(this);
		const поАтрибуту = /^\[([\w-]+)\]$/.exec(селектор);
		if (поАтрибуту) return потомки.filter((элемент) => элемент.getAttribute(поАтрибуту[1]) !== null);
		if (селектор === 'pre > code') {
			return потомки.filter((элемент) => элемент.тег === 'code' && элемент.parentNode.тег === 'pre');
		}
		throw new Error(`страница не знает селектора «${селектор}»`);
	}
}

class Фрагмент extends Элемент {
	constructor() {
		super('#document-fragment');
	}
}

class Документ extends Элемент {
	constructor(дети) {
		super('#document', {}, дети);
		this.readyState = 'complete';
	}

	addEventListener() {}

	createElement(тег) {
		return new Элемент(тег);
	}

	createTextNode(текст) {
		return new Текст(текст);
	}

	createDocumentFragment() {
		return new Фрагмент();
	}
}

function потомкиЭлемента(элемент) {
	return элемент.childNodes.filter((узел) => узел instanceof Элемент)
		.flatMap((ребёнок) => [ребёнок, ...потомкиЭлемента(ребёнок)]);
}

const блок = (метка) => new Элемент('pre', {}, [
	new Элемент('code', { class: 'language-bsl', id: метка }, [new Текст('Если Истина Тогда\n\tВозврат;\nКонецЕсли;')]),
]);

const документ = new Документ([
	new Элемент('div', { [атрибут]: pathToFileURL(файлДвижка).href }, [блок('с-атрибутом')]),
	new Элемент('div', {}, [блок('без-атрибута')]),
]);
const коды = документ.querySelectorAll('pre > code');
const раскрашен = (код) => код.childNodes.some((узел) => узел instanceof Элемент);
const пауза = (мс) => new Promise((готово) => setTimeout(готово, мс));

globalThis.document = документ;
new Function(fs.readFileSync(файлСкрипта, 'utf8'))();

// ждём первого раскрашенного блока, потом ещё немного — вдруг скрипт дойдёт и до второго
const срок = Date.now() + 10000;
while (!коды.some(раскрашен) && Date.now() < срок) await пауза(10);
await пауза(100);

console.log(коды.filter(раскрашен).map((код) => код.getAttribute('id')).join('\n'));
