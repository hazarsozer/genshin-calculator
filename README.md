# Genshin Calculator

A typed, tested **TypeScript port of [ASPirine's](https://github.com/aspirineilia/genshin_calc_pub) Genshin Impact damage calculator**.

Her original damage math is excellent and validated through game version **5.8** — it just wasn't built as a typed, tested library. This project carries that work forward as a clean, modular engine you can import, test, and build on.

> **Credits.** The damage formulas and game data are ASPirine's work, from [`genshin_calc_pub`](https://github.com/aspirineilia/genshin_calc_pub) (MIT) — original calculator: <https://genshin.aspirine.su/>. This port reproduces her engine's outputs in typed TypeScript with an extensive test suite. All credit for the underlying calculation model goes to her.

## What it does

Computes Genshin Impact damage as a `[non-crit, crit, average]` triple for any hit, across:

- **107 characters · 202 weapons · 55 artifact sets** (game v5.8)
- constellations, talent levels, refinements, artifact main/substats
- elemental reactions (amplifying, transformative, catalyze) and infusions
- **team buffs** (party-member auras, resonances, on-field/off-field buffs)
- heals, shields, and crystallize
- **rotations** — composing a sequence of hits into a total, with per-element/per-type sub-totals

## Layout

```
packages/
├── types/   — the shared data model (characters, weapons, artifacts, conditions, features, rotations)
├── core/    — the calculation engine (damage formula, crit, reactions, stats, post-effects) — pure functions
└── data/    — the game data + feature definitions + build assembly (buildStats, compileCharacter,
              compileFeature, compileRotation, party buffs) and the generated stat/talent tables
tests/       — golden test fixtures (expected outputs) consumed by the package test suites
```

## Quick start

Requires **Node ≥ 20** and **pnpm**.

```bash
pnpm install
pnpm build       # tsc -b across all packages
pnpm test        # run the full test suite
pnpm typecheck
```

## Testing

The engine is covered by **unit tests** plus a large **golden suite**: the port's output is asserted
against committed expected-value fixtures (`tests/golden/`). During development those fixtures were
generated from the original calculator and used as ground truth, so the port is validated to reproduce
ASPirine's results across the full character/weapon/artifact matrix — including talent levels,
constellations, enemy levels, stat regimes, sets, weapons, and team compositions.

## License

[MIT](./LICENSE) © Hazar Sözer. Derived from `genshin_calc_pub` (MIT, © 2025 ASPirine) — see Credits above.

## Disclaimer

Unofficial fan project. *Genshin Impact*, its characters, and all game data are trademarks and
copyright of **HoYoverse (COGNOSPHERE PTE. LTD.)**. This project is not affiliated with or endorsed
by HoYoverse.
