import { formatCOP } from '../lib/format';

export function KpiCard({
  label,
  value,
  porcentaje,
  porcentajeSuffix = 'sobre la venta',
  highlight,
  negative,
}: {
  label: string;
  value: number;
  porcentaje?: number;
  porcentajeSuffix?: string;
  highlight?: boolean;
  negative?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? 'border-orange-300 bg-orange-50' : 'bg-white'}`}>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`text-lg font-semibold ${negative ? 'text-red-600' : 'text-neutral-900'}`}>
        {formatCOP(value)}
      </p>
      {porcentaje !== undefined && (
        <p className="text-xs text-neutral-400">
          {porcentaje.toFixed(1)}% {porcentajeSuffix}
        </p>
      )}
    </div>
  );
}
