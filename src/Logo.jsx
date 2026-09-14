export default function Logo({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield shape - represents protection/entitlement/trust */}
      <path
        d="M24 4 L40 10 V22 C40 32.5 33.5 40.5 24 44 C14.5 40.5 8 32.5 8 22 V10 Z"
        fill="var(--color-forest)"
        stroke="var(--color-marigold)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Checkmark - represents eligibility confirmed / verified match */}
      <path
        d="M16 24 L21.5 29.5 L33 17"
        stroke="var(--color-marigold)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
