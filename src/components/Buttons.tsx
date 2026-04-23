import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  full?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  type?: 'button' | 'submit';
}

export function PrimaryButton({
  children,
  onClick,
  full = false,
  disabled = false,
  icon: Icon,
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${full ? 'w-full' : ''} inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300`}
    >
      {Icon && <Icon className="h-4 w-4" strokeWidth={2.2} />}
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, icon: Icon, type = 'button' }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
    >
      {Icon && <Icon className="h-4 w-4" strokeWidth={2.2} />}
      {children}
    </button>
  );
}
