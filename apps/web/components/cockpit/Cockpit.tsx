"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Stage } from "./Stage";
import { Rail } from "./Rail";
import { Drawer } from "./Drawer";
import { Breakdown } from "@/components/results/Breakdown";
import { CharacterDrawer } from "@/components/build/CharacterDrawer";
import { WeaponDrawer } from "@/components/build/WeaponDrawer";
import { ArtifactsDrawer } from "@/components/build/ArtifactsDrawer";
import { BuffsTeamDrawer } from "@/components/build/BuffsTeamDrawer";
import { EnemyDrawer } from "@/components/build/EnemyDrawer";
import type { DrawerId } from "./Rail";

const DRAWER_TITLES: Record<Exclude<DrawerId, null>, string> = {
  character: "Character",
  weapon: "Weapon",
  artifacts: "Artifacts",
  buffs: "Buffs & Team",
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
    case "enemy":
      return <EnemyDrawer />;
  }
}

/** The cockpit grid: icon rail · optional slide-out drawer · stage · breakdown. */
export function Cockpit() {
  const [activeDrawer, setActiveDrawer] = useState<DrawerId>(null);

  function handleRailOpen(id: DrawerId) {
    // Toggle: clicking the active rail button closes the drawer
    setActiveDrawer((prev) => (prev === id ? null : id));
  }

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {/* Icon rail */}
      <Rail active={activeDrawer} onOpen={handleRailOpen} />

      {/* Invisible backdrop — clicking outside the drawer closes it */}
      {activeDrawer && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActiveDrawer(null)}
        />
      )}

      {/* Slide-out drawer */}
      <AnimatePresence mode="popLayout">
        {activeDrawer && (
          <Drawer
            key={activeDrawer}
            title={DRAWER_TITLES[activeDrawer]}
            onClose={() => setActiveDrawer(null)}
          >
            <DrawerBody id={activeDrawer} />
          </Drawer>
        )}
      </AnimatePresence>

      {/* Main area: Stage (flex-1) + Breakdown column */}
      <div className="flex flex-1 overflow-hidden lg:flex-row flex-col">
        <div className="flex-1 overflow-y-auto p-5">
          <Stage />
        </div>
        <aside className="flex flex-col gap-4 overflow-y-auto border-t border-[var(--ck-border)] p-5 lg:w-[440px] lg:flex-none lg:border-l lg:border-t-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--ck-faint)]">
            Damage Breakdown
          </div>
          <Breakdown />
        </aside>
      </div>
    </div>
  );
}
