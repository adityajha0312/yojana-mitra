import Logo from './Logo'

const categories = [
  { label: 'Farmers', icon: <path d="M12 20 V8 M12 8 C12 8 8 9 8 13 C8 13 12 13 12 8 Z M12 8 C12 8 16 9 16 13 C16 13 12 13 12 8 Z" /> },
  { label: 'Students', icon: <path d="M4 9 L12 5 L20 9 L12 13 Z M7 11 V16 C7 16 9 18 12 18 C15 18 17 16 17 16 V11" /> },
  { label: 'Women', icon: <path d="M12 4 C9 4 7 6.5 7 9.5 C7 12 8.5 14 10.5 14.7 V17 H8.5 V19 H10.5 V21 H13.5 V19 H15.5 V17 H13.5 V14.7 C15.5 14 17 12 17 9.5 C17 6.5 15 4 12 4 Z" /> },
  { label: 'Senior Citizens', icon: <path d="M12 6 C13.5 6 14.5 7 14.5 8.5 C14.5 10 13.5 11 12 11 C10.5 11 9.5 10 9.5 8.5 C9.5 7 10.5 6 12 6 Z M6 20 C6 16 8.5 12.5 12 12.5 C15.5 12.5 18 16 18 20" /> },
  { label: 'General / BPL', icon: <path d="M5 20 V11 L12 6 L19 11 V20 Z M10 20 V15 H14 V20" /> },
  { label: 'Persons with Disabilities', icon: <path d="M12 6 C13 6 13.8 6.8 13.8 7.8 C13.8 8.8 13 9.6 12 9.6 C11 9.6 10.2 8.8 10.2 7.8 C10.2 6.8 11 6 12 6 Z M9 11 H15 L14 18 L12.5 18 L12 14 L11.5 18 L10 18 Z" /> },
  { label: 'Youth / Unemployed', icon: <path d="M12 4 L20 8 L12 12 L4 8 Z M4 8 V14 M8 10 V16 C8 16 9.5 18 12 18 C14.5 18 16 16 16 16 V10" /> },
]

export default function LandingPage({ onStart }) {
  return (
    <div style={styles.page}>
      <div style={styles.blobOne} />
      <div style={styles.blobTwo} />
      <header style={styles.header}>
        <Logo size={36} />
        <span style={styles.wordmark}>Yojana Mitra</span>
      </header>

      <main style={styles.hero}>
        <h1 style={styles.headline}>
          Find the government schemes<br />you're already entitled to.
        </h1>
        <p style={styles.subtext}>
          Tell Yojana Mitra a little about yourself — your work, your age, your family —
          and it matches you to real schemes from Madhya Pradesh and the central
          government, with the documents and steps to apply.
        </p>
        <button className="ym-cta" style={styles.cta} onClick={onStart}>
          Start Conversation
        </button>
      </main>

      <section style={styles.categoryStrip}>
        {categories.map((cat) => (
          <div key={cat.label} style={styles.categoryItem}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-forest)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {cat.icon}
            </svg>
            <span style={styles.categoryLabel}>{cat.label}</span>
          </div>
        ))}
      </section>

      <footer style={styles.footer}>
        Currently covering Madhya Pradesh state schemes and major central government schemes.
      </footer>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'transparent',
    color: 'var(--color-charcoal)',
    fontFamily: 'var(--font-body)',
    position: 'relative',
    overflow: 'hidden',
  },
  blobOne: {
    position: 'absolute',
    top: '-120px',
    right: '-140px',
    width: '480px',
    height: '480px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(232,163,61,0.45) 0%, rgba(232,163,61,0) 70%)',
    pointerEvents: 'none',
  },
  blobTwo: {
    position: 'absolute',
    bottom: '-180px',
    left: '-120px',
    width: '440px',
    height: '440px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(20,83,45,0.3) 0%, rgba(20,83,45,0) 70%)',
    pointerEvents: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '22px 28px',
  },
  wordmark: {
    fontFamily: 'var(--font-body)',
    fontSize: '19px',
    fontWeight: 700,
    color: 'var(--color-forest)',
  },
  hero: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '20px 28px 40px',
    maxWidth: '640px',
  },
  headline: {
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: 'clamp(28px, 6vw, 42px)',
    lineHeight: 1.18,
    margin: '0 0 18px',
    color: 'var(--color-forest)',
  },
  subtext: {
    fontSize: '16px',
    lineHeight: 1.6,
    color: 'var(--color-charcoal-soft)',
    maxWidth: '480px',
    margin: '0 0 28px',
  },
  cta: {
    alignSelf: 'flex-start',
    padding: '14px 26px',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    color: 'var(--color-cream)',
    background: 'var(--color-forest)',
    border: 'none',
    borderRadius: '999px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(20, 83, 45, 0.25)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  categoryStrip: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '26px',
    padding: '22px 28px 30px',
    borderTop: '1px solid rgba(20, 83, 45, 0.12)',
  },
  categoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13.5px',
    color: 'var(--color-charcoal-soft)',
  },
  categoryLabel: {
    whiteSpace: 'nowrap',
  },
  footer: {
    padding: '14px 28px 22px',
    fontSize: '12.5px',
    color: 'var(--color-charcoal-soft)',
    opacity: 0.75,
  },
}
