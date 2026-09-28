// Где лежит поставка подсветки: эти файлы уезжают в пакет oscript-md, инструмент их только
// собирает и стережёт. Движок и файл его лицензий — выход сборки, в git их нет.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const каталогПоставки = fileURLToPath(new URL('../../src/highlight/', import.meta.url));

// .mjs node грузит модулем без распознавания синтаксиса; браузер смотрит не на расширение, а на тип ответа
export const имяДвижка = 'shiki-bsl.mjs';
export const имяЛицензий = 'shiki-bsl.LICENSE.txt';
export const файлДвижка = path.join(каталогПоставки, имяДвижка);
export const файлЛицензий = path.join(каталогПоставки, имяЛицензий);
export const файлСкрипта = path.join(каталогПоставки, 'oscript-md-highlight.js');
export const файлСтилей = path.join(каталогПоставки, 'oscript-md-highlight.css');
