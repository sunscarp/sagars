/**
 * TS monogram — a thin circular outline with the serif "TS" ligature inside.
 * Purely decorative: it inherits colour from `currentColor` so it works on the
 * dark hero overlay and the light header alike. Size + font-size are driven by
 * the className (e.g. "h-10 w-10 text-[15px]"); the inner glyph scales in `em`.
 * Give the wrapping link an accessible label where a name is needed.
 */
export default function TSMonogram({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-current ${className}`}
    >
      <span
        style={{
          fontFamily: "var(--font-cormorant), Georgia, serif",
          fontSize: "0.98em",
          lineHeight: 1,
          letterSpacing: "0.06em",
          fontWeight: 400,
          paddingLeft: "0.06em",
        }}
      >
        TS
      </span>
    </span>
  );
}
