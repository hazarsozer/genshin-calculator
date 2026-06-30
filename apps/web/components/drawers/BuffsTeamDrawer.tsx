"use client";

import { useState } from "react";
import { ALL_CHARACTERS, ALL_WEAPONS } from "@genshin/data";
import { useBuildStore } from "@/lib/store";
import { collectGroupedConditions, collectPartyConditions } from "@/lib/conditions";
import { ConditionControlWidget } from "./ConditionControl";
import { CharAvatar } from "@/components/controls/CharAvatar";
import { Catalog } from "@/components/catalog/Catalog";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { addMember, removeMember, setMemberSetting, setMemberField, activeResonances, teammateLevelDefaults } from "@/lib/party";
import {
  TEAM_BUFF_SETS,
  OFF_FIELD_WEAPONS,
  ELEMENT_PICK_OPTIONS,
  SCROLL_TIER_OPTIONS,
  type TeamBuffSet,
  type OffFieldWeapon,
} from "@/lib/teamBuffs";
import { resonatingElements, partitionResonanceSubs } from "@/lib/resonanceSubs";
import { humanizeSlug } from "@/lib/utils";
import { avatarIconSources } from "@/lib/enkaArt";
import { LevelLine } from "@/components/controls/LevelLine";
import type { ConditionControl } from "@/lib/conditions";
import type { PartyMemberForm } from "@/lib/types";
import type { DbObjectChar } from "@genshin/types";
import type { EquippedSet } from "@genshin/data";

const MAX_TEAMMATES = 3;

// ── Global-condition accordion sections (resonance now roster-driven → dropped) ──
type SectionId = "set" | "weapon" | "other";

interface Section {
  id: SectionId;
  label: string;
  filter: (ctrl: ConditionControl) => boolean;
}

const SECTIONS: Section[] = [
  { id: "set", label: "Set Buffs", filter: (c) => c.name.startsWith("set_other") },
  {
    id: "weapon",
    label: "Weapon Buffs",
    filter: (c) => c.name.startsWith("weapon_other") || c.name.startsWith("weapon."),
  },
  { id: "other", label: "Global", filter: () => true },
];

function countActive(
  ctrls: ConditionControl[],
  form: ReturnType<typeof useBuildStore.getState>["form"]
): number {
  return ctrls.filter((c) =>
    c.kind === "boolean"
      ? (form.conditions.toggles[c.name] ?? false)
      : (form.conditions.stacks[c.name] ?? 0) > 0
  ).length;
}

function AccordionSection({
  label,
  controls,
  isOpen,
  onToggle,
}: {
  label: string;
  controls: ConditionControl[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const form = useBuildStore((s) => s.form);
  const active = countActive(controls, form);
  if (controls.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--ck-border)] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[var(--ck-surface2)]"
        style={{ background: isOpen ? "var(--ck-surface2)" : "var(--ck-surface)" }}
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ck-muted)]">
          {label}
        </span>
        {active > 0 && (
          <span
            className="ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
            style={{
              background: "color-mix(in srgb, var(--ck-accent) 20%, transparent)",
              color: "var(--ck-accent2)",
            }}
          >
            {active}
          </span>
        )}
        <span
          className="ml-auto text-[var(--ck-faint)] transition-transform"
          style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
        >
          ▾
        </span>
      </button>
      {isOpen && (
        <div className="flex flex-col gap-2 border-t border-[var(--ck-border)] p-3">
          {controls.map((ctrl) => (
            <ConditionControlWidget key={ctrl.name} ctrl={ctrl} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Team row ──
function TeamRow({
  activeSlug,
  members,
  onPickSlot,
  onRemove,
}: {
  activeSlug: string;
  members: readonly PartyMemberForm[];
  onPickSlot: () => void;
  onRemove: (index: number) => void;
}) {
  const slots = Array.from({ length: MAX_TEAMMATES }, (_, i) => members[i]);
  return (
    <div className="flex items-center gap-2">
      {/* Active character (read-only) */}
      <div className="flex flex-col items-center gap-1">
        <CharAvatar name={activeSlug} className="h-12 w-12 rounded-xl ring-2 ring-[var(--ck-accent)]" />
        <span className="text-[9px] text-[var(--ck-faint)]">You</span>
      </div>
      <span className="text-[var(--ck-faint)]">+</span>
      {slots.map((m, i) =>
        m ? (
          <button
            key={i}
            type="button"
            onClick={() => onRemove(i)}
            title={`Remove ${humanizeSlug(m.slug)}`}
            className="group relative flex flex-col items-center gap-1"
          >
            <CharAvatar name={m.slug} className="h-12 w-12 rounded-xl border border-[var(--ck-border)]" />
            <span className="text-[9px] text-[var(--ck-muted)] group-hover:text-[var(--ck-accent)]">
              {humanizeSlug(m.slug).split(" ")[0]} ✕
            </span>
          </button>
        ) : (
          <button
            key={i}
            type="button"
            onClick={() => onPickSlot()}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-[var(--ck-border)] text-[var(--ck-faint)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-accent)]"
          >
            +
          </button>
        )
      )}
    </div>
  );
}

// ── Per-teammate off-field Set / Weapon buff pickers (Wave 1.5) ──
function PickPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize transition-colors"
      style={{
        background: active
          ? "color-mix(in srgb, var(--ck-accent) 22%, transparent)"
          : "var(--ck-surface2)",
        color: active ? "var(--ck-accent2)" : "var(--ck-muted)",
      }}
    >
      {label}
    </button>
  );
}

function ChosenRow({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-[var(--ck-surface2)] px-2.5 py-1.5">
      <span className="text-[11px] font-semibold text-[var(--ck-text)]">{label}</span>
      <button
        type="button"
        onClick={onClear}
        className="text-[10px] font-bold text-[var(--ck-faint)] transition-colors hover:text-[var(--ck-accent)]"
      >
        Clear ✕
      </button>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-dashed border-[var(--ck-border)] px-2.5 py-1.5 text-left text-[11px] text-[var(--ck-faint)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-accent)]"
    >
      ＋ {label}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ck-faint)]">
      {children}
    </span>
  );
}

function TeammateOffFieldBuffs({
  member,
  index,
  members,
  weaponType,
  patchMembers,
}: {
  member: PartyMemberForm;
  index: number;
  members: readonly PartyMemberForm[];
  weaponType: DbObjectChar["weapon"];
  patchMembers: (next: PartyMemberForm[]) => void;
}) {
  const [setModalOpen, setSetModalOpen] = useState(false);
  const [weaponModalOpen, setWeaponModalOpen] = useState(false);

  const pickedSet = TEAM_BUFF_SETS.find((s) => s.gate === member.setKey);
  const pickedWeapon = OFF_FIELD_WEAPONS.find((w) => w.gate === member.weaponKey);
  const availableWeapons = OFF_FIELD_WEAPONS.filter((w) => w.weaponType === weaponType);

  function chooseSet(def: TeamBuffSet) {
    let next = setMemberField(members, index, "setKey", def.gate);
    // Seed a default element/tier so the buff is live immediately; clear the other variant's field.
    next = setMemberField(next, index, "setElement", def.elementPick ? ELEMENT_PICK_OPTIONS[0] : undefined);
    next = setMemberField(next, index, "setTier", def.tierPick ? SCROLL_TIER_OPTIONS[0] : undefined);
    patchMembers(next);
    setSetModalOpen(false);
  }
  function clearSet() {
    let next = setMemberField(members, index, "setKey", undefined);
    next = setMemberField(next, index, "setElement", undefined);
    next = setMemberField(next, index, "setTier", undefined);
    patchMembers(next);
  }
  function chooseWeapon(w: OffFieldWeapon) {
    let next = setMemberField(members, index, "weaponKey", w.gate);
    if (member.weaponRefine === undefined) next = setMemberField(next, index, "weaponRefine", 1);
    patchMembers(next);
    setWeaponModalOpen(false);
  }
  function clearWeapon() {
    let next = setMemberField(members, index, "weaponKey", undefined);
    next = setMemberField(next, index, "weaponRefine", undefined);
    patchMembers(next);
  }

  return (
    <div className="mt-2 flex flex-col gap-2.5 border-t border-[var(--ck-border)] pt-2.5">
      {/* ── Off-field Set buff ── */}
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Set Buff</FieldLabel>
        {pickedSet ? (
          <>
            <ChosenRow label={pickedSet.label} onClear={clearSet} />
            {pickedSet.elementPick && (
              <div className="flex flex-wrap items-center gap-1.5">
                {ELEMENT_PICK_OPTIONS.map((el) => (
                  <PickPill
                    key={el}
                    label={el}
                    active={member.setElement === el}
                    onClick={() => patchMembers(setMemberField(members, index, "setElement", el))}
                  />
                ))}
              </div>
            )}
            {pickedSet.tierPick && (
              <div className="flex flex-wrap items-center gap-1.5">
                {SCROLL_TIER_OPTIONS.map((t) => (
                  <PickPill
                    key={t}
                    label={`Tier ${t}`}
                    active={member.setTier === t}
                    onClick={() => patchMembers(setMemberField(members, index, "setTier", t))}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <AddButton label="Add set buff" onClick={() => setSetModalOpen(true)} />
        )}
      </div>

      {/* ── Off-field Weapon buff (filtered to the teammate's weapon type) ── */}
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Weapon Buff</FieldLabel>
        {availableWeapons.length === 0 ? (
          <span className="text-[11px] text-[var(--ck-faint)]">
            No off-field buffs for {weaponType}
          </span>
        ) : pickedWeapon ? (
          <>
            <ChosenRow label={pickedWeapon.label} onClear={clearWeapon} />
            <LevelLine
              label="Refine"
              value={member.weaponRefine ?? 1}
              min={1}
              max={5}
              onChange={(v) => patchMembers(setMemberField(members, index, "weaponRefine", v))}
            />
          </>
        ) : (
          <AddButton label="Add weapon buff" onClick={() => setWeaponModalOpen(true)} />
        )}
      </div>

      {/* ── Modals ── */}
      <CatalogModal open={setModalOpen} onClose={() => setSetModalOpen(false)} title="Off-field Set Buff">
        <Catalog
          items={TEAM_BUFF_SETS}
          getKey={(s) => s.gate}
          getLabel={(s) => s.label}
          getIconSources={() => []}
          activeKey={member.setKey}
          onPick={chooseSet}
        />
      </CatalogModal>
      <CatalogModal open={weaponModalOpen} onClose={() => setWeaponModalOpen(false)} title="Off-field Weapon Buff">
        <Catalog
          items={availableWeapons}
          getKey={(w) => w.gate}
          getLabel={(w) => w.label}
          getIconSources={() => []}
          activeKey={member.weaponKey}
          onPick={chooseWeapon}
        />
      </CatalogModal>
    </div>
  );
}

export function BuffsTeamDrawer() {
  const form = useBuildStore((s) => s.form);
  const setForm = useBuildStore((s) => s.setForm);
  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const char = ALL_CHARACTERS.find((c) => c.name === form.characterKey);
  const weapon = ALL_WEAPONS.find((w) => w.name === form.weaponKey);
  const members = form.party?.members ?? [];

  if (!char || !weapon) {
    return (
      <p className="text-[13px] text-[var(--ck-muted)]">
        Select a character and weapon first.
      </p>
    );
  }

  // Resonance from the four elements (active + teammates).
  const elements = [
    char.element,
    ...members.map((m) => ALL_CHARACTERS.find((c) => c.name === m.slug)?.element).filter(Boolean),
  ] as string[];
  const resonances = activeResonances(elements);

  // Characters available to add: exclude active + already-picked.
  const takenSlugs = new Set<string>([form.characterKey, ...members.map((m) => m.slug)]);
  const pickable = ALL_CHARACTERS.filter((c) => !takenSlugs.has(c.name));

  function patchMembers(next: PartyMemberForm[]) {
    setForm({ party: { members: next } });
  }

  // Existing global conditions (set/weapon/other) — resonance subs routed under Resonance.
  const grouped = collectGroupedConditions(char, weapon, form.manualSets as readonly EquippedSet[]);
  const resonating = resonatingElements(elements);
  const { resonanceSubs, rest } = partitionResonanceSubs(grouped.global, resonating);
  const seen = new Set<string>();
  const sections: Record<SectionId, ConditionControl[]> = { set: [], weapon: [], other: [] };
  for (const ctrl of rest) {
    if (seen.has(ctrl.name)) continue;
    seen.add(ctrl.name);
    for (const sec of SECTIONS) {
      if (sec.filter(ctrl)) { sections[sec.id].push(ctrl); break; }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Team ── */}
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ck-faint)]">
        Team
      </div>
      <TeamRow
        activeSlug={char.name}
        members={members}
        onPickSlot={() => setPickerOpen(true)}
        onRemove={(i) => patchMembers(removeMember(members, i))}
      />

      {/* ── Resonance (derived) ── */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ck-faint)]">
          Resonance
        </span>
        {resonances.length === 0 ? (
          <span className="text-[11px] text-[var(--ck-faint)]">None</span>
        ) : (
          resonances.map((r) => (
            <span
              key={r}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                background: "color-mix(in srgb, var(--ck-accent) 15%, transparent)",
                color: "var(--ck-accent2)",
              }}
            >
              {r}
            </span>
          ))
        )}
      </div>
      {resonanceSubs.length > 0 && (
        <div className="mt-2 flex w-full flex-col gap-2">
          {resonanceSubs.map((ctrl) => (
            <ConditionControlWidget key={ctrl.name} ctrl={ctrl} />
          ))}
        </div>
      )}

      {/* ── Per-teammate buffs ── */}
      {members.map((m, i) => {
        const tchar = ALL_CHARACTERS.find((c) => c.name === m.slug);
        if (!tchar) return null;
        const ctrls = collectPartyConditions(tchar);
        const levelDefaults = teammateLevelDefaults(tchar);
        return (
          <div key={m.slug} className="rounded-xl border border-[var(--ck-border)] p-3">
            <div className="mb-2 flex items-center gap-2">
              <CharAvatar name={m.slug} className="h-6 w-6 rounded-full" />
              <span className="text-[12px] font-bold">{humanizeSlug(m.slug)}</span>
            </div>
            {ctrls.length > 0 && (
              <div className="flex flex-col gap-2">
                {ctrls.map((ctrl) => (
                  <ConditionControlWidget
                    key={ctrl.name}
                    ctrl={ctrl}
                    binding={{
                      value: m.settings[ctrl.name] ?? (ctrl.name in levelDefaults ? 10 : ctrl.kind === "boolean" ? false : 0),
                      setValue: (v) => patchMembers(setMemberSetting(members, i, ctrl.name, v)),
                    }}
                  />
                ))}
              </div>
            )}
            <TeammateOffFieldBuffs
              member={m}
              index={i}
              members={members}
              weaponType={tchar.weapon}
              patchMembers={patchMembers}
            />
          </div>
        );
      })}

      {/* ── Global buffs (set / weapon / other) ── */}
      {SECTIONS.map((sec) => (
        <AccordionSection
          key={sec.id}
          label={sec.label}
          controls={sections[sec.id]}
          isOpen={openSection === sec.id}
          onToggle={() => setOpenSection((prev) => (prev === sec.id ? null : sec.id))}
        />
      ))}

      {/* ── Teammate picker ── */}
      <CatalogModal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add Teammate">
        <Catalog
          items={pickable}
          getKey={(c) => c.name}
          getLabel={(c) => humanizeSlug(c.name)}
          getIconSources={(c) => avatarIconSources(c.name)}
          onPick={(c) => {
            patchMembers(addMember(members, c.name));
            setPickerOpen(false);
          }}
          filters={[
            {
              group: "Element",
              options: [
                { label: "Pyro", value: "pyro", test: (c) => c.element === "pyro" },
                { label: "Hydro", value: "hydro", test: (c) => c.element === "hydro" },
                { label: "Electro", value: "electro", test: (c) => c.element === "electro" },
                { label: "Cryo", value: "cryo", test: (c) => c.element === "cryo" },
                { label: "Anemo", value: "anemo", test: (c) => c.element === "anemo" },
                { label: "Geo", value: "geo", test: (c) => c.element === "geo" },
                { label: "Dendro", value: "dendro", test: (c) => c.element === "dendro" },
              ],
            },
          ]}
        />
      </CatalogModal>
    </div>
  );
}
