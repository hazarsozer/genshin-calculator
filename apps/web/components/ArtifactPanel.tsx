'use client';

import { useBuildStore } from '@/lib/store';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { GoodImport } from './GoodImport';
import { ManualStatsForm } from './ManualStatsForm';
import { SetPicker } from './SetPicker';
import type { ArtifactMode } from '@/lib/types';

export function ArtifactPanel() {
  const artifactMode = useBuildStore((s) => s.form.artifactMode);
  const setForm = useBuildStore((s) => s.setForm);

  function handleTabChange(value: unknown) {
    if (value === 'good' || value === 'manual') {
      setForm({ artifactMode: value });
    }
  }

  return (
    <Tabs value={artifactMode} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="good">GOOD</TabsTrigger>
        <TabsTrigger value="manual">Manual</TabsTrigger>
      </TabsList>

      <TabsContent value="good">
        <GoodImport />
      </TabsContent>

      <TabsContent value="manual">
        <div className="flex flex-col gap-6 pt-2">
          <ManualStatsForm />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Artifact Sets</p>
            <SetPicker />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
