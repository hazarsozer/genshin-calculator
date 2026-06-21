"use client";

/**
 * Temporary spike page — proves the workspace engine packages are consumable
 * inside the Next.js App Router. Deleted in Task 10.
 */
export default function SpikePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Engine Spike</h1>
      <p className="mt-2 text-sm text-gray-500">
        The engine consumption test passes (see{" "}
        <code>lib/__tests__/spike.test.ts</code>). This page is a placeholder
        smoke-test route, deleted in Task 10.
      </p>
    </main>
  );
}
