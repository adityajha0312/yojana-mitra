export default function Logo({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="23" fill="var(--color-forest)" stroke="var(--color-marigold)" strokeWidth="1.5" />
      {/* Three converging paths meeting at a point - represents guidance/direction to the right scheme */}
      <path d="M12 32 L24 24 L14 14" stroke="var(--color-cream)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
      <path d="M24 34 L24 24 L24 12" stroke="var(--color-cream)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
      <path d="M36 32 L24 24 L34 14" stroke="var(--color-marigold)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="24" cy="24" r="3" fill="var(--color-marigold)" />
    </svg>
  )
}
