import { STATUS_CONFIG, colorMap } from '../lib/theme';
import type { ContractStatus } from '../types';

interface StatusBadgeProps {
  status: ContractStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending_docs;
  const c = colorMap[cfg.color];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${c.bg} ${c.text} ${c.ring}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      {cfg.label}
    </span>
  );
}
