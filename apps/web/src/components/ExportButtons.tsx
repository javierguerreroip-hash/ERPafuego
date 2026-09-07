import { exportToExcel, exportToPDF, type ExportColumn } from '../lib/export';

export function ExportButtons({
  filename,
  title,
  subtitle,
  columns,
  rows,
}: {
  filename: string;
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  rows: Record<string, string | number>[];
}) {
  const disabled = rows.length === 0;

  return (
    <div className="flex gap-2">
      <button
        onClick={() => exportToExcel(filename, title, columns, rows)}
        disabled={disabled}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
      >
        Exportar Excel
      </button>
      <button
        onClick={() => exportToPDF(filename, title, columns, rows, subtitle)}
        disabled={disabled}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
      >
        Exportar PDF
      </button>
    </div>
  );
}
