import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';

interface SectionProps {
  title: string;
  icon?: LucideIcon;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, icon: Icon, hint, children, className = '' }: SectionProps) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-violet-50">
              <Icon className="h-3.5 w-3.5 text-violet-600" strokeWidth={2} />
            </div>
          )}
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </div>
        </div>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      {children}
    </Card>
  );
}
