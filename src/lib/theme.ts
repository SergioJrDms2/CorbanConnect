import type { ContractStatus, ToneColor } from '../types';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  FileCheck,
  FileClock,
  FileX,
} from 'lucide-react';

export interface StatusStyle {
  color: ToneColor;
  label: string;
  icon: LucideIcon;
}

export const STATUS_CONFIG: Record<ContractStatus, StatusStyle> = {
  pending_docs: { color: 'amber', label: 'Pendência Documental', icon: FileClock },
  credit_analysis: { color: 'sky', label: 'Análise de Crédito', icon: Activity },
  at_risk: { color: 'red', label: 'Em Risco', icon: AlertTriangle },
  formalized: { color: 'emerald', label: 'Formalizado', icon: FileCheck },
  canceled: { color: 'slate', label: 'Cancelado', icon: FileX },
};

export interface ToneClasses {
  bg: string;
  text: string;
  ring: string;
  dot: string;
}

export const colorMap: Record<ToneColor, ToneClasses> = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', dot: 'bg-amber-500' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200', dot: 'bg-sky-500' },
  red: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200', dot: 'bg-red-500' },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  slate: { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-200', dot: 'bg-slate-500' },
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    ring: 'ring-violet-200',
    dot: 'bg-violet-500',
  },
};
