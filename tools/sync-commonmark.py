#!/usr/bin/env python3
"""Загружает CommonMark spec заданной версии, делает dump в JSON и генерирует
OneUnit-сьюты по секциям: tests/commonmark/<section-slug>.os.

Использование:
    python tools/sync-commonmark.py [version] [--force] [--skip-list PATH]

Пример:
    python tools/sync-commonmark.py 0.31.2

Зависимости: только стандартная библиотека Python 3.10+.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path
from typing import Optional

PROJECT_ROOT = Path(__file__).resolve().parent.parent
COMMONMARK_DIR = PROJECT_ROOT / "tests" / "commonmark"
CACHE_DIR = COMMONMARK_DIR / ".cache"
DEFAULT_SKIP_LIST = PROJECT_ROOT / "tools" / "commonmark-skip.json"
DEFAULT_VERSION = "0.31.2"


# --------------------------------------------------------------------------- #
# Загрузка spec.txt
# --------------------------------------------------------------------------- #

def download_spec(version: str, force: bool = False) -> str:
    """Скачивает spec.txt с сайта CommonMark, кеширует в .cache."""
    url = f"https://spec.commonmark.org/{version}/spec.txt"
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE_DIR / f"spec-{version}.txt"
    if cache_file.exists() and not force:
        print(f"[cache] {cache_file.relative_to(PROJECT_ROOT)}")
        return cache_file.read_text(encoding="utf-8")
    print(f"[download] {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "oscript-md-sync"})
    with urllib.request.urlopen(req) as resp:  # noqa: S310 (trusted host)
        content = resp.read().decode("utf-8")
    cache_file.write_text(content, encoding="utf-8")
    return content


# --------------------------------------------------------------------------- #
# Парсинг spec.txt → список примеров {number, section, markdown, html}
# --------------------------------------------------------------------------- #

FENCE_OPEN = re.compile(r"^`{10,}\s*example\s*$")
FENCE_CLOSE = re.compile(r"^`{10,}\s*$")
HEADER = re.compile(r"^#{1,6}\s+(.+?)(?:\s+#+)?\s*$")


def parse_spec(spec_text: str) -> list[dict]:
    """Парсинг spec.txt в список примеров, аналогично --dump-tests."""
    examples: list[dict] = []
    section = ""
    state = "text"
    md_lines: list[str] = []
    html_lines: list[str] = []
    number = 0

    # splitlines(keepends=True) сохраняет \n у каждой строки — это важно,
    # потому что итоговый markdown/html собирается через "".join без потери
    # переводов строк.
    for raw in spec_text.splitlines(keepends=True):
        line = raw.rstrip("\n").rstrip("\r")

        if state == "text":
            if FENCE_OPEN.match(line):
                state = "md"
                md_lines = []
                html_lines = []
                continue
            m = HEADER.match(line)
            if m:
                section = m.group(1).strip()
        elif state == "md":
            if line == ".":
                state = "html"
                continue
            md_lines.append(raw)
        elif state == "html":
            if FENCE_CLOSE.match(line):
                number += 1
                md_text = "".join(md_lines).replace("→", "\t")
                html_text = "".join(html_lines).replace("→", "\t")
                examples.append({
                    "number": number,
                    "section": section,
                    "markdown": md_text,
                    "html": html_text,
                })
                state = "text"
                continue
            html_lines.append(raw)

    return examples


# --------------------------------------------------------------------------- #
# Skip-list
# --------------------------------------------------------------------------- #

def load_skip_list(version: str, path: Path) -> dict:
    if not path.exists():
        return {"sections": {}, "examples": {}}
    raw = json.loads(path.read_text(encoding="utf-8"))
    v = raw.get(version, {})
    return {
        "sections": v.get("sections", {}),
        "examples": {int(k): val for k, val in v.get("examples", {}).items()},
    }


def skip_reason(example: dict, skip_list: dict) -> Optional[str]:
    if example["number"] in skip_list["examples"]:
        return skip_list["examples"][example["number"]]
    if example["section"] in skip_list["sections"]:
        return skip_list["sections"][example["section"]]
    return None


# --------------------------------------------------------------------------- #
# Кодогенерация OneScript
# --------------------------------------------------------------------------- #

def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "unsorted"


def to_identifier(s: str) -> str:
    s = re.sub(r"[^A-Za-z0-9]+", "_", s)
    return s.strip("_") or "x"


CONTINUATION_INDENT = "        "  # 8 пробелов перед `|` и оператором `+`


def to_oscript_literal(s: str) -> str:
    """Превращает Python-строку в выражение OneScript.

    Использует многострочный литерал OneScript (`"line1\n|line2"`), чтобы избежать
    цепочек `+ Символы.ПС + "..."`. Табы остаются как `Символы.Таб` через `+`,
    т.к. внутри строкового литерала их нельзя выделить визуально.
    """
    if not s:
        return '""'
    # Нормализуем \r\n → \n (spec.txt уже LF, но на всякий случай).
    s = s.replace("\r\n", "\n").replace("\r", "\n")

    segments = s.split("\t")
    parts: list[str] = []
    for i, seg in enumerate(segments):
        if i > 0:
            parts.append("Символы.Таб")
        if seg:
            parts.append(_multiline_literal(seg))
        # пустые сегменты между табами не порождают отдельных "" — двойной таб
        # выглядит как `Символы.Таб + Символы.Таб`, что и нужно.

    if not parts:
        return '""'
    return _join_with_plus(parts)


def _multiline_literal(s: str) -> str:
    """Tab-free строка → один OneScript-литерал с `|` для продолжений."""
    escaped = s.replace('"', '""')
    lines = escaped.split("\n")
    if len(lines) == 1:
        return f'"{lines[0]}"'
    out = [f'"{lines[0]}']
    for line in lines[1:]:
        out.append(f"{CONTINUATION_INDENT}|{line}")
    return "\n".join(out) + '"'


def _join_with_plus(parts: list[str]) -> str:
    if len(parts) == 1:
        return parts[0]
    out = [parts[0]]
    for p in parts[1:]:
        out.append(f"{CONTINUATION_INDENT}+ {p}")
    return "\n".join(out)


def escape_quotes(s: str) -> str:
    return s.replace('"', '""')


SUITE_TEMPLATE = """\
// AUTO-GENERATED by tools/sync-commonmark.py — DO NOT EDIT MANUALLY.
// CommonMark spec version: {version}
// Section: {section}
// Examples: {total} (skipped: {skipped})
//
// Источник:    https://spec.commonmark.org/{version}/spec.txt
// Регенерация: python tools/sync-commonmark.py {version}

#Использовать asserts
#Использовать "../../src"

Перем _Настройки;

&ОтображаемоеИмя("commonmark_{version_id}_{section_id}")
&ТестовыйНабор
Процедура ПриСозданииОбъекта() Экспорт
    _Настройки = Новый MarkdownНастройки("commonmark");
КонецПроцедуры

Процедура ПроверитьПример(Знач Номер, Знач Исходник, Знач ОжидаемыйHTML) Экспорт
    Фактический = Markdown.ВHTML(Исходник, _Настройки);
    Утверждения.ПроверитьРавенство(ОжидаемыйHTML, Фактический,
        "CommonMark #" + Номер + " [{section_label}]");
КонецПроцедуры

{methods}
"""


def render_method(example: dict, skip_list: dict) -> str:
    reason = skip_reason(example, skip_list)
    skip_line = ""
    if reason:
        skip_line = f'&Выключен("{escape_quotes(reason)}")\n'
    md_lit = to_oscript_literal(example["markdown"])
    html_lit = to_oscript_literal(example["html"])
    return (
        f"&Тест\n"
        f"{skip_line}"
        f"Процедура Пример_{example['number']:04d}() Экспорт\n"
        f"    Исходник = {md_lit};\n"
        f"    Ожидаемый = {html_lit};\n"
        f"    ПроверитьПример({example['number']}, Исходник, Ожидаемый);\n"
        f"КонецПроцедуры\n"
    )


def render_suite(section: str, examples: list[dict], version: str,
                 skip_list: dict) -> str:
    skipped = sum(1 for e in examples if skip_reason(e, skip_list) is not None)
    methods = "\n".join(render_method(e, skip_list) for e in examples)
    return SUITE_TEMPLATE.format(
        version=version,
        section=section,
        section_label=escape_quotes(section),
        section_id=to_identifier(section),
        version_id=to_identifier(version),
        total=len(examples),
        skipped=skipped,
        methods=methods,
    )


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Sync CommonMark spec tests into OneUnit suites",
    )
    parser.add_argument("version", nargs="?", default=DEFAULT_VERSION,
                        help=f"CommonMark spec version (default: {DEFAULT_VERSION})")
    parser.add_argument("--force", action="store_true",
                        help="Re-download spec.txt even if cached")
    parser.add_argument("--skip-list", type=Path, default=DEFAULT_SKIP_LIST,
                        help="Path to skip-list JSON")
    parser.add_argument("--keep-existing", action="store_true",
                        help="Don't delete existing tests/commonmark/*.os before generating")
    args = parser.parse_args(argv)

    print(f"=== Sync CommonMark {args.version} ===")

    spec_text = download_spec(args.version, args.force)
    examples = parse_spec(spec_text)
    print(f"[parse]   {len(examples)} examples")

    json_path = CACHE_DIR / f"spec-{args.version}.json"
    json_path.write_text(
        json.dumps(examples, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"[dump]    {json_path.relative_to(PROJECT_ROOT)}")

    skip_list = load_skip_list(args.version, args.skip_list)
    if skip_list["sections"] or skip_list["examples"]:
        print(f"[skip]    sections={len(skip_list['sections'])}, "
              f"examples={len(skip_list['examples'])}")

    by_section: dict[str, list[dict]] = {}
    for ex in examples:
        section = ex["section"] or "Unsorted"
        by_section.setdefault(section, []).append(ex)

    COMMONMARK_DIR.mkdir(parents=True, exist_ok=True)
    if not args.keep_existing:
        removed = 0
        for f in COMMONMARK_DIR.glob("*.os"):
            f.unlink()
            removed += 1
        if removed:
            print(f"[clean]   removed {removed} stale .os file(s)")

    total_generated = 0
    total_examples = 0
    total_skipped = 0
    for section, exs in by_section.items():
        slug = slugify(section)
        out = COMMONMARK_DIR / f"{slug}.os"
        out.write_text(
            render_suite(section, exs, args.version, skip_list),
            encoding="utf-8",
        )
        skipped = sum(1 for e in exs if skip_reason(e, skip_list) is not None)
        total_generated += 1
        total_examples += len(exs)
        total_skipped += skipped
        print(f"          {out.name}: {len(exs):3d} examples (skipped {skipped})")

    print(f"[done]    {total_generated} suites, {total_examples} examples, "
          f"{total_skipped} skipped")
    print("\nRun: oscript tasks/test_commonmark.os")
    return 0


if __name__ == "__main__":
    sys.exit(main())
