'use client';

import { useEffect } from 'react';
import { useBuildStore } from '@/lib/store';
import { decodeBuild } from '@/lib/url';
import { CharacterPicker } from '@/components/CharacterPicker';
import { WeaponPicker } from '@/components/WeaponPicker';
import { LevelInputs } from '@/components/LevelInputs';
import { TalentInputs } from '@/components/TalentInputs';
import { ConditionsPanel } from '@/components/ConditionsPanel';
import { ArtifactPanel } from '@/components/ArtifactPanel';
import { EnemyPanel } from '@/components/EnemyPanel';
import { ResultsTable } from '@/components/ResultsTable';
import { ShareButton } from '@/components/ShareButton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function CalculatorPage() {
  const setForm = useBuildStore((s) => s.setForm);

  // Hydrate store from URL hash on first mount.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setForm(decodeBuild(hash.slice(1)));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Genshin Damage Calculator
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Built on a verified, oracle-gated engine —{' '}
              <a
                href="https://github.com/hazarsozer/genshin-calculator"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                open source
              </a>
            </p>
          </div>
          <ShareButton />
        </div>
      </header>

      {/* Main two-column layout */}
      <main className="mx-auto w-full max-w-7xl flex-1 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Left column — build inputs */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Character &amp; Weapon</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <CharacterPicker />
                <WeaponPicker />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Levels &amp; Talents</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <LevelInputs />
                <TalentInputs />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <ConditionsPanel />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Artifacts</CardTitle>
              </CardHeader>
              <CardContent>
                <ArtifactPanel />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enemy</CardTitle>
              </CardHeader>
              <CardContent>
                <EnemyPanel />
              </CardContent>
            </Card>
          </div>

          {/* Right column — results */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Damage Output</CardTitle>
              </CardHeader>
              <CardContent>
                <ResultsTable />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
