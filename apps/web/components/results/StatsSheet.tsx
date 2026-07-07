"use client";

import { buildStatSheet, type StatRow } from "@/lib/statSheet";

const fmtFlat = (n: number) => Math.round(n).toLocaleString("en-US");
const fmtPercent = (n: number) => `${n.toFixed(1)}%`;

function fmtTotal(row: StatRow): string {
  return row.format === "percent" ? fmtPercent(row.total) : fmtFlat(row.total);
}

function fmtBase(row: StatRow): string {
  if (row.base === null) return "—";
  return row.format === "percent" ? fmtPercent(row.base) : fmtFlat(row.base);
}

function fmtBonus(row: StatRow): string {
  const formatted =
    row.format === "percent" ? fmtPercent(row.bonus) : fmtFlat(row.bonus);
  return row.bonus > 0 ? `+${formatted}` : formatted;
}

interface StatsSheetProps {
  stats?: Readonly<Record<string, number>>;
}

export function StatsSheet({ stats }: StatsSheetProps) {
  const groups = stats ? buildStatSheet(stats) : [];

  if (groups.length === 0) {
    return (
      <p className="text-sm text-[var(--ck-muted)]">No stats available.</p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.title}>
          <div className="mb-2.5 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.15em] text-[var(--ck-faint)]">
            {group.title}
            <span className="h-px flex-1 bg-[var(--ck-border)]" />
          </div>

          <div className="flex flex-col gap-1.5">
            {group.rows.map((row) => (
              <div
                key={row.key}
                className="grid grid-cols-4 items-baseline gap-2 text-[12.5px] tabular-nums"
              >
                <span className="col-span-1 font-medium text-[13px]">
                  {row.label}
                </span>
                <span className="text-right text-[var(--ck-muted)]">
                  {fmtBase(row)}
                </span>
                <span className="text-right text-[var(--ck-muted)]">
                  {fmtBonus(row)}
                </span>
                <span
                  className="text-right text-[14px] font-bold"
                  data-testid={`stat-total-${row.key}`}
                >
                  {fmtTotal(row)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
