// Собирает src/highlight/oscript-md-highlight.js одним файлом; в конце файла — лицензии
// всех пакетов, чей код вошёл в сборку, и грамматики BSL.

import { build } from 'esbuild';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const { outputFiles: [скрипт], metafile } = await build({
	entryPoints: ['подсветка.js'],
	outfile: '../../src/highlight/oscript-md-highlight.js',
	bundle: true,
	format: 'esm',
	minify: true,
	metafile: true,
	write: false,
});

const пакеты = new Set(Object.keys(metafile.inputs)
	.map((путь) => путь.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)?.[1])
	.filter(Boolean));

const лицензии = [...пакеты].sort().map((пакет) => {
	const каталог = join('node_modules', пакет);
	const файл = readdirSync(каталог).find((имя) => /^licen[cs]e/i.test(имя));
	return `${пакет}\n\n${readFileSync(join(каталог, файл), 'utf8')}`;
});
лицензии.push(readFileSync('лицензия-грамматики-bsl.txt', 'utf8'));

mkdirSync(dirname(скрипт.path), { recursive: true });
writeFileSync(скрипт.path, `${скрипт.text}/*!\n${лицензии.join('\n---\n\n').replaceAll('*/', '* /')}*/\n`);
