interface LogoProps {
  /** Rendered height in pixels */
  height?: number;
  /** Use white text (for dark backgrounds) */
  white?: boolean;
  className?: string;
}

/**
 * Corban Connect wordmark.
 *
 * Infinity symbol (forming the double-O of "connect") rendered with a
 * blue → violet → magenta gradient, followed by "nnect" in heavy sans-serif.
 */
export function Logo({ height = 28, white = false, className }: LogoProps) {
  const textFill = white ? '#ffffff' : '#0f172a';

  return (
    <svg
      viewBox="0 0 560 150"
      height={height}
      role="img"
      aria-label="Connect"
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="corban-infinity-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#c026d3" />
        </linearGradient>
      </defs>

      {/* Infinity — the two "oo" of "connect" */}
      <path
        d="M 30 75
           C 30 30, 95 30, 135 75
           C 175 120, 240 120, 240 75
           C 240 30, 175 30, 135 75
           C 95 120, 30 120, 30 75 Z"
        fill="none"
        stroke={white ? '#ffffff' : 'url(#corban-infinity-gradient)'}
        strokeWidth="32"
        strokeLinecap="round"
      />

      {/* "nnect" */}
      <text
        x="260"
        y="112"
        fontFamily="'Geist', 'Inter', system-ui, sans-serif"
        fontSize="112"
        fontWeight="800"
        letterSpacing="-4"
        fill={textFill}
      >
        nnect
      </text>
    </svg>
  );
}
