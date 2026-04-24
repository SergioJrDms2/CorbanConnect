import { Logo } from './Logo';

interface BrandProps {
  small?: boolean;
  white?: boolean;
  /** Show the "Starbank · Starlabs" tagline next to the logo */
  tagline?: boolean;
}

export function Brand({ small = false, white = false, tagline = false }: BrandProps) {
  const height = small ? 22 : 32;
  return (
    <div className="flex items-center gap-3">
      <Logo height={height} white={white} />
      {tagline && (
        <div
          className={`hidden border-l pl-3 text-[10px] font-medium uppercase leading-tight tracking-[0.18em] sm:block ${
            white ? 'border-white/20 text-white/70' : 'border-slate-200 text-slate-400'
          }`}
        >
          Starbank
          <br />
          Starlabs
        </div>
      )}
    </div>
  );
}
