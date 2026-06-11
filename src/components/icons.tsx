// components/icons/StrokeStyleIcons.tsx

export function SolidLineIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <line
        x1="1" y1="8" x2="15" y2="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DashedLineIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <line
        x1="1" y1="8" x2="15" y2="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 3"       // ✅ dashed
      />
    </svg>
  );
}

export function DottedLineIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <line
        x1="1" y1="8" x2="15" y2="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 4"       // ✅ dotted
      />
    </svg>
  );
}