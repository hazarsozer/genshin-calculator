# Genshin Calculator

An LLM-maintained knowledge base for building a modern Genshin Impact damage calculator — carrying
forward **Aspirine's** abandoned [`genshin_calc_pub`](https://github.com/aspirineilia/genshin_calc_pub)
(MIT). Her damage math is excellent and validated through game v5.8; it just lacks types and tests.
The goal is a typed, tested calculator built on her formulas + data.

This repo is, for now, the **wiki** that compiles and maintains that understanding. The calculator
build comes next, informed by what's here.

## Layout

| Path | What it is |
|------|------------|
| `CLAUDE.md` | The **schema** — conventions + ingest/query/lint workflows. Start here. |
| `wiki/` | The knowledge base (LLM-written). Open this folder as an Obsidian vault. |
| `wiki/_meta/index.md` | Catalog of every page — the navigation backbone. |
| `wiki/game/mechanics/` | How Genshin's damage math works (the spec for the new calc). |
| `wiki/tools/calculator/` | How Aspirine's code implements it (reference to port from). |
| `wiki/game/entities/` | Complete catalogs of all 107 characters / 202 weapons / 55 artifact sets. |
| `wiki/_meta/decisions/` | Architecture decision records. |
| `raw/genshin_calc_pub/` | Aspirine's vendored source (code + data; image blobs excluded). |

## How to use it

- **Browse:** open `wiki/` as an Obsidian vault — pages use `[[wikilinks]]`, frontmatter, and a
  connected graph. (Plain markdown everywhere else too.)
- **Drive:** in a Claude Code session here, ask questions or say *"ingest `<source>`"*. The agent reads
  the schema and maintains the wiki — see `CLAUDE.md`.

## Credit

Calculation logic and game data originate from **Aspirine's** `genshin_calc_pub` (MIT License,
© ASPirine). This project builds on that work; the license is retained in `raw/genshin_calc_pub/LICENSE`.
