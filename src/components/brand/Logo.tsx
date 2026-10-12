import { cn } from "@/lib/utils";

/**
 * The MatchCV.ai mark: a document with a check badge on its corner.
 *
 * <p>Drawn as inline SVG rather than shipped as a file so it inherits the
 * current colour, stays crisp at the 20px favicon-ish sizes in the sidebar and
 * the 64px sizes on the landing page, and costs no extra request.
 *
 * <p>The badge green is the literal brand token, so the mark and the product
 * never drift apart. The tile behind it stays near-navy in both themes --
 * that contrast is what the mark is, and a logo that restyles itself is not a
 * logo.
 */
export function LogoMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="MatchCV.ai"
      className={cn("shrink-0", className)}
    >
      <rect width="48" height="48" rx="13" fill="#131a2a" />
      <rect
        width="48"
        height="48"
        rx="13"
        fill="url(#mcv-tile)"
        fillOpacity="0.5"
      />

      {/* The sheet, with a folded corner. */}
      <path
        d="M14 13.5A2.5 2.5 0 0 1 16.5 11h10.3c.4 0 .8.16 1.1.44l6.2 6.02c.3.28.45.67.45 1.07V34.5a2.5 2.5 0 0 1-2.5 2.5h-15.5a2.5 2.5 0 0 1-2.5-2.5v-21Z"
        fill="#ffffff"
      />
      <path
        d="M27 11.3v5.2a1.5 1.5 0 0 0 1.5 1.5h5.3"
        stroke="#c3ccdd"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lines of text on the sheet, shortening the way a paragraph does. */}
      <g stroke="#8c99b4" strokeWidth="1.9" strokeLinecap="round">
        <path d="M18.6 22.4h6.2" />
        <path d="M18.6 26.4h11" />
        <path d="M18.6 30.4h7.6" />
      </g>

      {/* The check badge. The ring is the tile colour, not a stroke, so the
          badge reads as sitting on top of the sheet rather than cut into it. */}
      <circle cx="33.6" cy="31.6" r="8.6" fill="#131a2a" />
      <circle cx="33.6" cy="31.6" r="7" fill="var(--brand, #2fe3a6)" />
      <path
        d="m30.2 31.7 2.5 2.5 4.6-5"
        stroke="#08201a"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <defs>
        <linearGradient id="mcv-tile" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#1d2740" />
          <stop offset="1" stopColor="#0d1320" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** The mark plus the name. The ".ai" is dimmed so "MatchCV" reads first. */
export function Logo({
  size = 32,
  className,
  showWordmark = true,
}: {
  size?: number;
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <span className="text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
          MatchCV<span className="text-ink-faint">.ai</span>
        </span>
      )}
    </span>
  );
}

/** The one line that goes under the mark wherever the brand is introduced. */
export const TAGLINE = "Your experience. The right opportunity.";
