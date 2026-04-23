import { Rocket } from 'lucide-react';

interface BrandProps {
  small?: boolean;
  white?: boolean;
}

export function Brand({ small = false, white = false }: BrandProps) {
  return (
    <div className={`flex items-center gap-2 ${small ? 'text-base' : 'text-lg'}`}>
      <div
        className={`${small ? 'h-7 w-7' : 'h-9 w-9'} grid place-items-center rounded-lg bg-violet-600`}
      >
        <Rocket className={`${small ? 'h-4 w-4' : 'h-5 w-5'} text-white`} strokeWidth={2.2} />
      </div>
      <div className="leading-none">
        <div
          className={`font-semibold tracking-tight ${white ? 'text-white' : 'text-slate-900'}`}
        >
          Star <span className="text-violet-600">Connect</span>
        </div>
        {!small && (
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Starbank · Starlabs
          </div>
        )}
      </div>
    </div>
  );
}
