interface StatChipProps {
  label: string;
  value: string;
  hot?: boolean;
}

/** One stat pill in the stage strip. `hot` tints the value with the element accent. */
export function StatChip({ label, value, hot }: StatChipProps) {
  return (
    <div className="flex flex-col gap-px rounded-[10px] border border-[var(--ck-border)] bg-white/[0.045] px-3 py-2">
      <span className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--ck-faint)]">
        {label}
      </span>
      <span
        className="text-[15px] font-bold tabular-nums"
        style={hot ? { color: "var(--ck-accent2)" } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
