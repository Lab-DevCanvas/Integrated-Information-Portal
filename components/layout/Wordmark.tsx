const LETTER_COLORS = ["#2563eb", "#db2777", "#f59e0b", "#f97316", "#7c3aed", "#0d9488", "#dc2626"];
const OVERLAP = "-0.19em";
const TIGHT = "-0.13em";
const WORD_GAP = "0.28em";

export function Wordmark({ text = "OP FINDER", className = "" }: { text?: string; className?: string }) {
  const chars = text.split("");
  let letterIndex = 0;

  return (
    <span className={`font-extrabold ${className}`}>
      {chars.map((ch, i) => {
        if (ch === " ") {
          return <span key={i} style={{ marginLeft: WORD_GAP }} />;
        }

        const prevChar = chars[i - 1];
        const atWordStart = i === 0 || prevChar === " ";
        // The "I" is too thin to survive the full overlap effect legibly, so it (and its immediate
        // neighbors) sit flush instead of overlapping, while the rest of the wordmark keeps overlapping.
        const nearI = ch === "I" || prevChar === "I";
        const color = LETTER_COLORS[letterIndex % LETTER_COLORS.length];
        letterIndex++;

        return (
          <span
            key={i}
            className="mix-blend-multiply dark:mix-blend-screen"
            style={{ color, marginLeft: atWordStart ? 0 : nearI ? TIGHT : OVERLAP }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}
