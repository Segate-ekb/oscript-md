#!/usr/bin/env python3
"""Генерирует src/internal/inline/Модули/html-entities.json — таблицу именованных
HTML-сущностей для MarkdownInlineПарсер.ПопробоватьСущность.

Источник данных — модуль `html.entities` стандартной библиотеки Python
(`html.entities.html5`). Это срез HTML5 named character references,
встроенный в каждый дистрибутив CPython. Не требует сети.

CommonMark §6.2 признаёт только формы с точкой с запятой на конце,
поэтому ключи без `;` отфильтровываются.

Использование:
    python tools/sync-html-entities.py
"""

from __future__ import annotations

import html.entities
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = PROJECT_ROOT / "src" / "internal" / "inline" / "Модули" / "html-entities.json"


def main() -> int:
    flat = {k[:-1]: v for k, v in html.entities.html5.items() if k.endswith(";")}
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(flat, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"[write] {OUT_PATH.relative_to(PROJECT_ROOT)} ({len(flat)} entries)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
