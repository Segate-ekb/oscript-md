// Сборка движка подсветки: минифицированный ESM-бандл shiki с грамматикой BSL и файл
// лицензий всего, что в него вошло. `npm run build` пишет оба файла в поставку, src/highlight;
// в git их нет, пакет получает их при opm build.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { имяДвижка, имяЛицензий, каталогПоставки } from './пути.js';

const здесь = path.dirname(fileURLToPath(import.meta.url));
const черта = '='.repeat(80);

// Собирает движок и файл его лицензий в каталог; возвращает { метафайл } — отчёт esbuild
// о том, какие файлы и сколькими байтами вошли в бандл.
export async function собрать(каталог = каталогПоставки) {
	const итог = await esbuild.build({
		absWorkingDir: здесь,
		entryPoints: ['движок.js'],
		outfile: имяДвижка,
		bundle: true,
		format: 'esm',
		target: 'es2024',
		minify: true,
		charset: 'utf8',
		legalComments: 'none',
		banner: { js: шапкаДвижка() },
		metafile: true,
		write: false,
	});

	fs.mkdirSync(каталог, { recursive: true });
	fs.writeFileSync(path.join(каталог, имяДвижка), итог.outputFiles[0].contents);
	fs.writeFileSync(path.join(каталог, имяЛицензий), лицензии(итог.metafile));

	return { метафайл: итог.metafile };
}

function шапкаДвижка() {
	const shiki = сведенияПакета(path.join('node_modules', '@shikijs', 'primitive'));
	return `/* oscript-md, подсветка кода: shiki ${shiki.version} с грамматикой BSL, тема css-variables.`
		+ ` Собрано tools/highlight; лицензии вошедших пакетов — ${имяЛицензий}. */`;
}

function лицензии(метафайл) {
	const корни = new Set();
	for (const выход of Object.values(метафайл.outputs)) {
		for (const [вход, доля] of Object.entries(выход.inputs)) {
			const корень = кореньПакета(вход);
			if (корень && доля.bytesInOutput > 0) корни.add(корень);
		}
	}

	// порядок — по кодам символов, а не по локали: файл лицензий обязан пересобираться байт в байт
	const пакеты = [...корни].map(разделПакета)
		.sort((а, б) => (а.заголовок > б.заголовок) - (а.заголовок < б.заголовок));

	return [
		`Движок подсветки кода oscript-md (${имяДвижка}) собран из пакетов npm, перечисленных ниже,`,
		'и из грамматики BSL. У каждого — текст его лицензии. Файл пишет tools/highlight/собрать.js',
		'вместе с движком, руками его не правят.',
		'',
		...[...пакеты, разделГрамматики()]
			.flatMap((раздел) => [черта, раздел.заголовок, черта, '', раздел.текст, '']),
	].join('\n');
}

// Грамматика приехала внутри чужого пакета без своей лицензии: её текст лежит рядом
// со сборкой, первая строка файла — заголовок раздела.
function разделГрамматики() {
	const [заголовок, ...текст] = построчно(
		fs.readFileSync(path.join(здесь, 'лицензия-грамматики-bsl.txt'), 'utf8')).split('\n');
	return { заголовок, текст: текст.join('\n').trim() };
}

// «node_modules/@shikijs/core/dist/index.mjs» → «node_modules/@shikijs/core»
function кореньПакета(вход) {
	const звенья = вход.split(/[\\/]/);
	const начало = звенья.lastIndexOf('node_modules');
	if (начало < 0) return null;
	const длина = звенья[начало + 1].startsWith('@') ? 3 : 2;
	return звенья.slice(0, начало + длина).join('/');
}

function разделПакета(корень) {
	const пакет = сведенияПакета(корень);
	const каталог = path.join(здесь, корень);
	const файл = fs.readdirSync(каталог).find((имя) => /^licen[cs]e(\.(md|txt))?$/i.test(имя));
	if (!файл) {
		throw new Error(`У пакета ${пакет.name} нет файла лицензии: движок без неё не собирается.`);
	}
	return {
		заголовок: `${пакет.name} ${пакет.version} — ${пакет.license}`,
		текст: построчно(fs.readFileSync(path.join(каталог, файл), 'utf8')),
	};
}

function сведенияПакета(корень) {
	return JSON.parse(fs.readFileSync(path.join(здесь, корень, 'package.json'), 'utf8'));
}

function построчно(текст) {
	return текст.replace(/\r\n?/g, '\n').trimEnd();
}

// npm run build запускает этот файл напрямую; тесты берут из него только функцию сборки
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
	await собрать();
}
