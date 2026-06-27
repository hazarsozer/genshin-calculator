"use client";

import { useEffect } from "react";
import { useBuildStore } from "@/lib/store";
import { decodeBuild } from "@/lib/url";
import { Cockpit } from "@/components/cockpit/Cockpit";

export default function CalculatorPage() {
  const setForm = useBuildStore((s) => s.setForm);

  // Hydrate the store from the URL hash on first mount.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) setForm(decodeBuild(hash.slice(1)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <Cockpit />;
}
