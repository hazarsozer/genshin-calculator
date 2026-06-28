"use client";

import { useState, useEffect } from "react";
import { ALL_CHARACTERS } from "@genshin/data";
import { useBuildStore } from "@/lib/store";
import { collectGroupedConditions } from "@/lib/conditions";
import { ALL_WEAPONS } from "@genshin/data";
import { humanizeSlug } from "@/lib/utils";
import { avatarIconSources } from "@/lib/enkaArt";
import { Catalog } from "@/components/catalog/Catalog";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { CharAvatar } from "@/components/controls/CharAvatar";
import { LevelSlider } from "@/components/controls/LevelSlider";
import { LevelLine } from "@/components/controls/LevelLine";
import { talentCap } from "@/lib/levelTable";
import { ConditionControlWidget } from "./ConditionControl";
import type { EquippedSet } from "@genshin/data";

/** Section heading inside a drawer. */
function SectionHead({ label }: { label: string }) {
  return (
    <div className="mb-1 mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ck-faint)]">
      {label}
    </div>
  );
}

const INFUSION_ELEMENTS = [
  { value: "pyro", label: "Pyro" },
  { value: "hydro", label: "Hydro" },
  { value: "electro", label: "Electro" },
  { value: "cryo", label: "Cryo" },
  { value: "anemo", label: "Anemo" },
  { value: "geo", label: "Geo" },
  { value: "dendro", label: "Dendro" },
] as const;

export function CharacterDrawer() {
  const form = useBuildStore((s) => s.form);
  const setForm = useBuildStore((s) => s.setForm);
  const [search, setSearch] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(false);

  const char = ALL_CHARACTERS.find((c) => c.name === form.characterKey);
  const weapon = ALL_WEAPONS.find((w) => w.name === form.weaponKey);

  // Grouped conditions — self group only goes in this drawer
  const equipped: readonly EquippedSet[] = form.manualSets;
  const grouped =
    char && weapon ? collectGroupedConditions(char, weapon, equipped) : null;

  // Infusion relevance heuristic: anemo chars can absorb; chars with any
  // infusion-related condition in their self group can self-infuse.
  const showInfusion =
    char &&
    (char.element === "anemo" ||
      (grouped?.self ?? []).some((c) => c.name.includes("infusion")));

  const filtered =
    search.trim() === ""
      ? ALL_CHARACTERS
      : ALL_CHARACTERS.filter((c) =>
          humanizeSlug(c.name).toLowerCase().includes(search.toLowerCase())
        );

  function handlePick(key: string) {
    setSearch("");
    setForm({ characterKey: key, conditions: { toggles: {}, stacks: {} } });
  }

  function handleInfusion(value: string) {
    setForm({
      conditions: {
        ...form.conditions,
        infusion: value || undefined,
      },
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* ── Character picker ── */}
      <SectionHead label="Character" />
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
              filtered.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handlePick(c.name)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--ck-text)] transition-colors hover:bg-[var(--ck-surface2)]"
                >
                  <CharAvatar
                    name={c.name}
                    className="h-6 w-6 flex-none rounded-full"
                  />
                  {humanizeSlug(c.name)}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Currently selected character pill + Browse trigger */}
      {char && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-3">
          <CharAvatar
            name={char.name}
            className="h-10 w-10 flex-none rounded-full"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold">{humanizeSlug(char.name)}</div>
            <div className="text-[11px] text-[var(--ck-muted)]">
              {char.element.charAt(0).toUpperCase() + char.element.slice(1)} ·{" "}
              {"★".repeat(char.rarity)}
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

      {/* Character Browse modal */}
      <CatalogModal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        title="Browse Characters"
      >
        <Catalog
          items={ALL_CHARACTERS}
          getKey={(c) => c.name}
          getLabel={(c) => humanizeSlug(c.name)}
          getIconSources={(c) => avatarIconSources(c.name)}
          activeKey={form.characterKey}
          onPick={(c) => {
            handlePick(c.name);
            setCatalogOpen(false);
          }}
          filters={[
            {
              group: "Element",
              options: [
                { label: "Pyro",     value: "pyro",     test: (c) => c.element === "pyro" },
                { label: "Hydro",    value: "hydro",    test: (c) => c.element === "hydro" },
                { label: "Electro",  value: "electro",  test: (c) => c.element === "electro" },
                { label: "Cryo",     value: "cryo",     test: (c) => c.element === "cryo" },
                { label: "Anemo",    value: "anemo",    test: (c) => c.element === "anemo" },
                { label: "Geo",      value: "geo",      test: (c) => c.element === "geo" },
                { label: "Dendro",   value: "dendro",   test: (c) => c.element === "dendro" },
              ],
            },
            {
              group: "Weapon",
              options: [
                { label: "Sword",    value: "sword",    test: (c) => c.weapon === "sword" },
                { label: "Claymore", value: "claymore", test: (c) => c.weapon === "claymore" },
                { label: "Polearm",  value: "polearm",  test: (c) => c.weapon === "polearm" },
                { label: "Catalyst", value: "catalyst", test: (c) => c.weapon === "catalyst" },
                { label: "Bow",      value: "bow",      test: (c) => c.weapon === "bow" },
              ],
            },
          ]}
        />
      </CatalogModal>

      {/* ── Level ── */}
      <SectionHead label="Level" />
      <LevelSlider
        level={form.charLevel}
        ascension={form.ascension}
        onChange={(l, a) => {
          // Talent level is capped by ascension (her SKILL_LEVELS, Character.js:99) —
          // lowering ascension clamps any talent above the new cap.
          const cap = talentCap(a);
          setForm({
            charLevel: l,
            ascension: a,
            talents: {
              attack: Math.min(form.talents.attack, cap),
              elemental: Math.min(form.talents.elemental, cap),
              burst: Math.min(form.talents.burst, cap),
            },
          });
        }}
      />

      {/* ── Talents ── */}
      <SectionHead label="Talents" />
      <LevelLine
        label="Normal Attack"
        value={form.talents.attack}
        min={1}
        max={talentCap(form.ascension)}
        onChange={(v) => setForm({ talents: { ...form.talents, attack: v } })}
      />
      <LevelLine
        label="Elemental Skill"
        value={form.talents.elemental}
        min={1}
        max={talentCap(form.ascension)}
        onChange={(v) =>
          setForm({ talents: { ...form.talents, elemental: v } })
        }
      />
      <LevelLine
        label="Elemental Burst"
        value={form.talents.burst}
        min={1}
        max={talentCap(form.ascension)}
        onChange={(v) => setForm({ talents: { ...form.talents, burst: v } })}
      />

      {/* ── Constellation ── */}
      <SectionHead label="Constellation" />
      <LevelLine
        label="C"
        value={form.constellation}
        min={0}
        max={6}
        onChange={(v) => setForm({ constellation: v })}
      />

      {/* ── Infusion (conditional) ── */}
      {showInfusion && (
        <>
          <SectionHead label="Attack Infusion" />
          <select
            value={form.conditions.infusion ?? ""}
            onChange={(e) => handleInfusion(e.target.value)}
            className="w-full rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface2)] px-3 py-2 text-[13px] text-[var(--ck-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ck-accent)]"
          >
            <option value="">None</option>
            {INFUSION_ELEMENTS.map((el) => (
              <option key={el.value} value={el.value}>
                {el.label}
              </option>
            ))}
          </select>
        </>
      )}

      {/* ── Self conditions ── */}
      {grouped && grouped.self.length > 0 && (
        <>
          <SectionHead label="Conditions" />
          <div className="flex flex-col gap-2">
            {grouped.self.map((ctrl) => (
              <ConditionControlWidget key={ctrl.name} ctrl={ctrl} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
