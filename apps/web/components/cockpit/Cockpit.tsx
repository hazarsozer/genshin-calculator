"use client";

import { useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { Stage } from "./Stage";
import { Rail, MobileTabBar } from "./Rail";
import { Drawer } from "./Drawer";
import { Breakdown } from "@/components/results/Breakdown";
import { CharacterDrawer } from "@/components/drawers/CharacterDrawer";
import { WeaponDrawer } from "@/components/drawers/WeaponDrawer";
import { ArtifactsDrawer } from "@/components/drawers/ArtifactsDrawer";
import { BuffsTeamDrawer } from "@/components/drawers/BuffsTeamDrawer";
import { FoodDrawer } from "@/components/drawers/FoodDrawer";
import { EnemyDrawer } from "@/components/drawers/EnemyDrawer";
import { useResults } from "@/lib/useResults";
import { useCountUp, fmt } from "@/lib/motion";
import type { DrawerId } from "./Rail";

const DRAWER_TITLES: Record<Exclude<DrawerId, null>, string> = {
  character: "Character",
  weapon: "Weapon",
  artifacts: "Artifacts",
  buffs: "Buffs & Team",
  food: "Food",
  enemy: "Enemy",
};

function DrawerBody({ id }: { id: Exclude<DrawerId, null> }) {
  switch (id) {
    case "character":
      return <CharacterDrawer />;
    case "weapon":
      return <WeaponDrawer />;
    case "artifacts":
      return <ArtifactsDrawer />;
    case "buffs":
      return <BuffsTeamDrawer />;
    case "food":
      return <FoodDrawer />;
    case "enemy":
      return <EnemyDrawer />;
  }
}

/**
 * Sticky mini-result header — only visible on mobile (lg:hidden).
 * Shows the highest-average feature label + count-up damage number so the
 * user can see the result while scrolling through build inputs.
 */
function MiniResultHeader() {
  const result = useResults();
  const headline = result.features.length
    ? [...result.features].sort((a, b) => b.triple[2] - a.triple[2])[0]
    : null;

  // Hook must always be called — inactive when headline is null.
  const avgDisplay = useCountUp(headline?.triple[2] ?? 0);
  const prefersReduced = useReducedMotion();
  void prefersReduced; // satisfied — useCountUp already handles reduced-motion

  return (
    <div className="lg:hidden sticky top-14 z-20 flex items-center justify-between border-b border-[var(--ck-border)] bg-[rgba(11,8,9,0.92)] px-4 py-2 backdrop-blur-sm">
      <span className="max-w-[55%] truncate text-xs text-[var(--ck-muted)]">
        {headline?.label ?? "Pick a character"}
      </span>
      {headline && (
        <span
          className="font-[family-name:var(--font-display)] text-2xl tabular-nums"
          style={{ color: "var(--ck-accent2)" }}
        >
          {fmt(headline.triple[2])}
        </span>
      )}
    </div>
  );
}

/** The cockpit grid: icon rail · optional slide-out drawer · stage · breakdown. */
export function Cockpit() {
  const [activeDrawer, setActiveDrawer] = useState<DrawerId>(null);

  function handleRailOpen(id: DrawerId) {
    // Toggle: clicking the active rail button closes the drawer
    setActiveDrawer((prev) => (prev === id ? null : id));
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* Mobile sticky mini-result header (hidden on lg+) */}
      <MiniResultHeader />

      {/* Main cockpit row: [rail] [drawer?] [stage + breakdown] */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left icon rail — desktop only */}
        <Rail active={activeDrawer} onOpen={handleRailOpen} />

        {/* Backdrop — closes drawer on outside click.
            On mobile: z-[35] sits above bottom tab bar (z-30) so tab bar is
            inaccessible while a sheet is open (prevents accidental navigation).
            On desktop: z-10 (below drawer at z-20). */}
        {activeDrawer && (
          <div
            className="fixed inset-0 z-[35] lg:z-10"
            onClick={() => setActiveDrawer(null)}
          />
        )}

        {/* Slide-out drawer (desktop) / bottom sheet (mobile).
            Stable key: switching drawers swaps contents without stacking
            exit+enter; only open (null→id) and close (id→null) animate. */}
        <AnimatePresence>
          {activeDrawer && (
            <Drawer
              key="drawer"
              title={DRAWER_TITLES[activeDrawer]}
              onClose={() => setActiveDrawer(null)}
            >
              <DrawerBody id={activeDrawer} />
            </Drawer>
          )}
        </AnimatePresence>

        {/* Main content area.
            Mobile  (< lg): single scrollable column — outer div scrolls, children
                            are flex-none so both Stage and Breakdown are visible.
            Desktop (lg+):  two independent scroll panes side-by-side (unchanged). */}
        <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          {/* Stage pane */}
          <div className="p-5 lg:flex-1 lg:overflow-y-auto">
            <Stage />
          </div>

          {/* Breakdown pane.
              pb-20 on mobile gives clearance above the fixed bottom tab bar. */}
          <aside className="flex flex-col gap-4 border-t border-[var(--ck-border)] p-5 pb-20 lg:w-[440px] lg:flex-none lg:overflow-y-auto lg:border-l lg:border-t-0 lg:pb-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--ck-faint)]">
              Damage Breakdown
            </div>
            <Breakdown />
          </aside>
        </div>
      </div>

      {/* Mobile bottom tab bar — fixed; replaces left rail on small screens */}
      <MobileTabBar active={activeDrawer} onOpen={handleRailOpen} />
    </div>
  );
}
