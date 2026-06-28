"use client";

import { useEffect, useState } from "react";
import { ALL_CHARACTERS, ALL_WEAPONS } from "@genshin/data";
import { useBuildStore } from "@/lib/store";
import { collectGroupedConditions } from "@/lib/conditions";
import { humanizeSlug } from "@/lib/utils";
import { LevelSlider } from "@/components/controls/LevelSlider";
import { LevelLine } from "@/components/controls/LevelLine";
import { ConditionControlWidget } from "./ConditionControl";
import { Catalog, FallbackImage } from "@/components/catalog/Catalog";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { weaponIconSources } from "@/lib/enkaArt";
import type { CatalogFilterGroup } from "@/components/catalog/Catalog";
import type { DbObjectWeapon } from "@genshin/types";
import type { EquippedSet } from "@genshin/data";

function SectionHead({ label }: { label: string }) {
  return (
    <div className="mb-1 mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ck-faint)]">
      {label}
    </div>
  );
}

export function WeaponDrawer() {
  const form = useBuildStore((s) => s.form);
  const setForm = useBuildStore((s) => s.setForm);
  const [search, setSearch] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(false);

  const char = ALL_CHARACTERS.find((c) => c.name === form.characterKey);
  const weapon = ALL_WEAPONS.find((w) => w.name === form.weaponKey);
  const weaponType = char?.weapon ?? "sword";

  const compatibleWeapons = ALL_WEAPONS.filter((w) => w.weapon === weaponType);

  const rarityFilters: CatalogFilterGroup<DbObjectWeapon>[] = [
    {
      group: "Rarity",
      options: [
        { label: "3★", value: "3", test: (w) => w.rarity === 3 },
        { label: "4★", value: "4", test: (w) => w.rarity === 4 },
        { label: "5★", value: "5", test: (w) => w.rarity === 5 },
      ],
    },
  ];

  // Reset weapon when character weapon type changes
  useEffect(() => {
    const valid = compatibleWeapons.some((w) => w.name === form.weaponKey);
    if (!valid && compatibleWeapons.length > 0) {
      setForm({ weaponKey: compatibleWeapons[0].name });
    }
  }, [weaponType]); // eslint-disable-line react-hooks/exhaustive-deps

  const equipped: readonly EquippedSet[] = form.manualSets;
  const grouped =
    char && weapon ? collectGroupedConditions(char, weapon, equipped) : null;

  const filtered =
    search.trim() === ""
      ? compatibleWeapons
      : compatibleWeapons.filter((w) =>
          humanizeSlug(w.name).toLowerCase().includes(search.toLowerCase())
        );

  function handlePick(key: string) {
    setSearch("");
    setForm({ weaponKey: key });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* ── Weapon picker ── */}
      <SectionHead label="Weapon" />
      <div className="relative">
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface2)] px-3 py-1.5 text-[13px] text-[var(--ck-text)] placeholder-[var(--ck-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--ck-accent)]"
        />
        {search.trim() !== "" && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] shadow-xl">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-[var(--ck-faint)]">
                No results
              </div>
            ) : (
              filtered.map((w) => (
                <button
                  key={w.name}
                  type="button"
                  onClick={() => handlePick(w.name)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--ck-text)] transition-colors hover:bg-[var(--ck-surface2)]"
                >
                  <FallbackImage
                    sources={weaponIconSources(w)}
                    alt=""
                    className="h-7 w-7 shrink-0 rounded-md"
                  />
                  {humanizeSlug(w.name)}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Currently selected weapon pill + Browse trigger */}
      {weapon && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-3">
          <FallbackImage
            sources={weaponIconSources(weapon)}
            alt=""
            className="h-9 w-9 flex-none rounded-md"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold">{humanizeSlug(weapon.name)}</div>
            <div className="text-[11px] capitalize text-[var(--ck-muted)]">
              {weaponType} · {"★".repeat(weapon.rarity ?? 5)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className="flex-none rounded-lg border border-[var(--ck-border)] px-2.5 py-1.5 text-[11px] text-[var(--ck-muted)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-accent)]"
          >
            Browse
          </button>
        </div>
      )}

      {/* Weapon Browse modal */}
      <CatalogModal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        title="Browse Weapons"
      >
        <Catalog<DbObjectWeapon>
          items={compatibleWeapons}
          getKey={(w) => w.name}
          getLabel={(w) => humanizeSlug(w.name)}
          getIconSources={(w) => weaponIconSources(w)}
          filters={rarityFilters}
          activeKey={form.weaponKey}
          onPick={(w) => {
            handlePick(w.name);
            setCatalogOpen(false);
          }}
        />
      </CatalogModal>

      {/* ── Level ── */}
      <SectionHead label="Weapon Level" />
      <LevelSlider
        level={form.weaponLevel}
        ascension={form.weaponAscension}
        onChange={(l, a) => setForm({ weaponLevel: l, weaponAscension: a })}
      />

      {/* ── Refinement ── */}
      <SectionHead label="Refinement" />
      <LevelLine
        label="R"
        value={form.weaponRefine}
        min={1}
        max={5}
        onChange={(v) => setForm({ weaponRefine: v })}
      />

      {/* ── Weapon conditions ── */}
      {grouped && grouped.weapon.length > 0 && (
        <>
          <SectionHead label="Weapon Passive" />
          <div className="flex flex-col gap-2">
            {grouped.weapon.map((ctrl) => (
              <ConditionControlWidget key={ctrl.name} ctrl={ctrl} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
