'use client';

import { useResults } from '@/lib/useResults';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/** Format a damage number: round to integer, add thousands separators. */
function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function ResultsTable() {
  const result = useResults();

  return (
    <div className="flex flex-col gap-3">
      {result.error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {result.error}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Feature</TableHead>
            <TableHead className="text-right">Non-Crit</TableHead>
            <TableHead className="text-right">Crit</TableHead>
            <TableHead className="text-right">Average</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.features.map((f) => (
            <TableRow key={f.key}>
              <TableCell className="font-medium">{f.label}</TableCell>
              <TableCell className="text-right tabular-nums">
                {fmt(f.triple[0])}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {fmt(f.triple[1])}
              </TableCell>
              <TableCell
                className="text-right tabular-nums"
                data-testid="result-avg"
              >
                {fmt(f.triple[2])}
              </TableCell>
            </TableRow>
          ))}
          {!result.error && result.features.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No features to display.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
