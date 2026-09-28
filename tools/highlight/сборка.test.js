// Движок в git не хранится: его собирают из package-lock при opm build, в задачах тестов
// и в CI. Доверие к минифицированному файлу держится на том, что сборка из одного lock
// даёт одни и те же байты, а файл лицензий называет всё, что вошло в движок.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { собрать } from './собрать.js';
import { имяДвижка, имяЛицензий } from './пути.js';

async function свежаяСборка() {
	const каталог = fs.mkdtempSync(path.join(os.tmpdir(), 'подсветка-сборка-'));
	const итог = await собрать(каталог);
	return { каталог, итог };
}

const убрать = (...сборки) => сборки.forEach(({ каталог }) => fs.rmSync(каталог, { recursive: true, force: true }));

test('две сборки из одного package-lock дают движок и лицензии байт в байт', async () => {
	const первая = await свежаяСборка();
	const вторая = await свежаяСборка();
	try {
		for (const имя of [имяДвижка, имяЛицензий]) {
			const раз = fs.readFileSync(path.join(первая.каталог, имя));
			const два = fs.readFileSync(path.join(вторая.каталог, имя));
			assert.ok(раз.length > 0, `${имя}: сборка записала пустой файл`);
			assert.ok(раз.equals(два), `${имя}: сборки разошлись — ${раз.length} и ${два.length} байт`);
		}
	} finally {
		убрать(первая, вторая);
	}
});

test('лицензии называют каждый пакет, чей код вошёл в движок, и происхождение грамматики', async () => {
	const сборка = await свежаяСборка();
	try {
		const лицензии = fs.readFileSync(path.join(сборка.каталог, имяЛицензий), 'utf8');
		const [выход] = Object.values(сборка.итог.метафайл.outputs);
		const пакеты = new Set();
		for (const [вход, доля] of Object.entries(выход.inputs)) {
			const звенья = вход.split(/[\\/]/);
			const начало = звенья.lastIndexOf('node_modules') + 1;
			if (начало === 0 || доля.bytesInOutput === 0) continue;
			пакеты.add(звенья[начало].startsWith('@') ? `${звенья[начало]}/${звенья[начало + 1]}` : звенья[начало]);
		}

		assert.ok(пакеты.has('@shikijs/primitive'), `разбор входов ослеп: ${[...пакеты].join(', ')}`);
		for (const пакет of пакеты) {
			assert.ok(лицензии.includes(`${пакет} `), `в ${имяЛицензий} нет пакета ${пакет}`);
		}
		assert.ok(лицензии.includes('1c-syntax/vsc-language-1c-bsl'), 'происхождение грамматики BSL');
	} finally {
		убрать(сборка);
	}
});
