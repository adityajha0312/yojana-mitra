import { useState } from 'react'
import Logo from './Logo'
import { ArrowRightIcon, GlobeIcon, HelpCircleIcon } from './Icons'

const POPULAR_SCHEMES = [
  { name: 'PM-KISAN', blurb: '₹6,000/year direct income support for farmers', color: 'var(--color-forest)' },
  { name: 'Ayushman Bharat', blurb: 'Free health cover up to ₹5 lakh/family/year', color: 'var(--color-rose)' },
  { name: 'PM Awas Yojana', blurb: 'Assistance for building a pucca house', color: 'var(--color-marigold-dark)' },
  { name: 'National Scholarship Portal', blurb: 'Scholarships across school & higher education', color: 'var(--color-teal)' },
  { name: 'Ujjwala Yojana', blurb: 'Free LPG connections for BPL households', color: 'var(--color-plum)' },
  { name: 'Atal Pension Yojana', blurb: 'Guaranteed monthly pension after age 60', color: 'var(--color-sky)' },
]

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const NAV_LINKS = [
  { label: 'Home', id: 'top' },
  { label: 'Schemes', id: 'categories' },
  { label: 'How It Works', id: 'how-it-works' },
  { label: 'About', id: 'about' },
]

const CATEGORIES = [
  {
    label: 'Farmers',
    sub: 'Kisan Samman, MSP & more',
    color: 'var(--color-forest)',
    tint: 'rgba(20,83,45,0.1)',
    opener: "I'm a farmer, help me find schemes for me.",
    icon: <path d="M12 20 V8 M12 8 C12 8 8 9 8 13 C8 13 12 13 12 8 Z M12 8 C12 8 16 9 16 13 C16 13 12 13 12 8 Z" />,
  },
  {
    label: 'Students',
    sub: 'Scholarships & education',
    color: 'var(--color-teal)',
    tint: 'rgba(28,110,140,0.1)',
    opener: "I'm a student looking for scholarship schemes.",
    icon: <path d="M4 9 L12 5 L20 9 L12 13 Z M7 11 V16 C7 16 9 18 12 18 C15 18 17 16 17 16 V11" />,
  },
  {
    label: 'Women',
    sub: 'Safety, empowerment & more',
    color: 'var(--color-rose)',
    tint: 'rgba(184,73,108,0.1)',
    opener: 'I want to find schemes for women.',
    icon: <path d="M12 4 C9 4 7 6.5 7 9.5 C7 12 8.5 14 10.5 14.7 V17 H8.5 V19 H10.5 V21 H13.5 V19 H15.5 V17 H13.5 V14.7 C15.5 14 17 12 17 9.5 C17 6.5 15 4 12 4 Z" />,
  },
  {
    label: 'Senior Citizens',
    sub: 'Pension, healthcare & more',
    color: 'var(--color-plum)',
    tint: 'rgba(107,91,149,0.1)',
    opener: "I'm a senior citizen looking for pension or healthcare schemes.",
    icon: <path d="M12 6 C13.5 6 14.5 7 14.5 8.5 C14.5 10 13.5 11 12 11 C10.5 11 9.5 10 9.5 8.5 C9.5 7 10.5 6 12 6 Z M6 20 C6 16 8.5 12.5 12 12.5 C15.5 12.5 18 16 18 20" />,
  },
  {
    label: 'Families / BPL',
    sub: 'Housing, ration & more',
    color: 'var(--color-marigold-dark)',
    tint: 'rgba(201,127,30,0.1)',
    opener: 'My family needs help with housing or ration card schemes.',
    icon: <path d="M5 20 V11 L12 6 L19 11 V20 Z M10 20 V15 H14 V20" />,
  },
  {
    label: 'Youth / Unemployed',
    sub: 'Skill development & jobs',
    color: 'var(--color-sky)',
    tint: 'rgba(30,107,58,0.1)',
    opener: "I'm unemployed and looking for youth or skill schemes.",
    icon: <path d="M12 4 L20 8 L12 12 L4 8 Z M4 8 V14 M8 10 V16 C8 16 9.5 18 12 18 C14.5 18 16 16 16 16 V10" />,
  },
]

const FEATURES = [
  { label: 'AI-matched to you', detail: 'Not a generic list — schemes picked for your situation' },
  { label: 'Voice & Hindi/English', detail: 'Speak or type in the language you\u2019re comfortable with' },
  { label: 'Works with patchy internet', detail: 'Browse saved schemes even when offline' },
  { label: 'Never stores your documents', detail: 'Photos go straight to reading the text, nothing kept' },
]

const HOW_IT_WORKS = [
  { title: 'Tell us about yourself', detail: 'Your occupation, age, or family situation — by typing or speaking.' },
  { title: 'Get matched instantly', detail: 'Yojana Mitra checks real scheme criteria and explains what fits.' },
  { title: 'Apply with confidence', detail: 'Upload your documents and get a pre-filled application summary.' },
]

export default function LandingPage({ onStart }) {
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <div style={styles.page} id="top">
      <div style={styles.fieldBand} />

      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          <Logo size={34} />
          <div>
            <div style={styles.navTitle}>Yojana Mitra</div>
            <div style={styles.navSubtitle}>Your Scheme Companion</div>
          </div>
        </div>
        <div style={styles.navLinks}>
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={`#${l.id}`}
              style={styles.navLink}
              onClick={(e) => { e.preventDefault(); scrollToSection(l.id) }}
            >
              {l.label}
            </a>
          ))}
        </div>
        <div style={styles.navActions}>
          <span style={styles.langPill}><GlobeIcon size={13} /> English</span>
          <button className="ym-cta" style={styles.startNowBtn} onClick={() => scrollToSection('popular')}>
            Popular Schemes <ArrowRightIcon size={14} color="var(--color-cream)" />
          </button>
        </div>
      </nav>

      <main style={styles.hero}>
        <div style={styles.heroText}>
          <span style={styles.eyebrowPill}>Govt. Schemes · One Chat · For You</span>
          <h1 style={styles.headline}>
            Your dreams.<br />Our schemes.
          </h1>
          <p style={styles.subtext}>
            Yojana Mitra helps you discover government schemes that match your life —
            with plain-language explanations, the documents you'll need, and exactly
            how to apply, all in the language you speak at home.
          </p>
          <div style={styles.heroActions}>
            <button className="ym-cta" style={styles.primaryCta} onClick={() => onStart()}>
              Find My Schemes <ArrowRightIcon size={15} color="var(--color-cream)" />
            </button>
            <a href="#how-it-works" style={styles.secondaryCta} onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works') }}>How it works</a>
          </div>
          <div style={styles.featureRow}>
            {FEATURES.map((f) => (
              <div key={f.label} style={styles.featureItem}>
                <div style={styles.featureDot} />
                <div>
                  <div style={styles.featureLabel}>{f.label}</div>
                  <div style={styles.featureDetail}>{f.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.heroVisual}>
          <svg viewBox="0 0 420 380" style={styles.heroSvg} aria-hidden="true">
            <defs>
              <radialGradient id="ymOrbGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff3d6" stopOpacity="1" />
                <stop offset="35%" stopColor="var(--color-marigold)" stopOpacity="0.95" />
                <stop offset="70%" stopColor="var(--color-marigold-dark)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--color-marigold-dark)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle className="ym-glow-orb" cx="330" cy="70" r="70" fill="url(#ymOrbGlow)" />
            <circle cx="330" cy="70" r="22" fill="#fff8e8" opacity="0.9" />
            <path d="M0 260 C 90 200, 150 230, 210 210 C 280 186, 340 220, 420 200 L420 380 L0 380 Z" fill="var(--color-forest)" opacity="0.16" />
            <path d="M0 300 C 100 250, 180 280, 260 260 C 320 246, 370 270, 420 250 L420 380 L0 380 Z" fill="var(--color-forest)" opacity="0.28" />
            <path d="M0 340 C 110 305, 200 330, 300 310 C 350 300, 390 320, 420 308 L420 380 L0 380 Z" fill="var(--color-forest)" />
            <rect x="150" y="270" width="66" height="52" rx="3" fill="var(--color-cream)" stroke="var(--color-forest)" strokeWidth="2" />
            <path d="M144 274 L183 244 L222 274 Z" fill="var(--color-marigold-dark)" />
            <rect x="174" y="298" width="18" height="24" fill="var(--color-forest)" />
            <line x1="40" y1="330" x2="40" y2="290" stroke="var(--color-forest)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="40" cy="278" r="16" fill="var(--color-forest-light)" />
            <line x1="365" y1="335" x2="365" y2="300" stroke="var(--color-forest)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="365" cy="288" r="14" fill="var(--color-forest-light)" />
          </svg>

          <div style={styles.chatPreview}>
            <div style={styles.chatPreviewHeader}>
              <div style={styles.chatPreviewAvatar}><Logo size={22} /></div>
              <div>
                <div style={styles.chatPreviewName}>Namaste! I'm Yojana Mitra</div>
                <div style={styles.chatPreviewSub}>Let's find what you may be eligible for</div>
              </div>
            </div>
            <div style={styles.chatPreviewChips}>
              {['I\u2019m a farmer with 2 acres', 'I\u2019m a student', 'I need help for my family'].map((c) => (
                <button key={c} style={styles.chatPreviewChip} onClick={() => onStart(c)}>{c}</button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <section id="popular" style={styles.popularSection}>
        <h2 style={styles.sectionTitle}>Popular schemes right now</h2>
        <p style={styles.sectionSubtitle}>A few widely-used schemes to get you started — tap one to ask about it directly.</p>
        <div style={styles.popularGrid}>
          {POPULAR_SCHEMES.map((s) => (
            <button
              key={s.name}
              style={styles.popularCard}
              className="ym-category-card"
              onClick={() => onStart(`Tell me about ${s.name} and whether I might be eligible.`)}
            >
              <span style={{ ...styles.popularDot, background: s.color }} />
              <span style={styles.popularTextWrap}>
                <span style={styles.categoryLabel}>{s.name}</span>
                <span style={styles.categorySub}>{s.blurb}</span>
              </span>
              <ArrowRightIcon size={15} color="var(--color-charcoal-soft)" />
            </button>
          ))}
        </div>
      </section>

      <section id="categories" style={styles.categorySection}>
        <div style={styles.categoryHeadRow}>
          <div>
            <h2 style={styles.sectionTitle}>Explore schemes by category</h2>
            <p style={styles.sectionSubtitle}>Choose what describes you — we'll open the chat with the right questions ready.</p>
          </div>
        </div>
        <div style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              style={styles.categoryCard}
              className="ym-category-card"
              onClick={() => onStart(cat.opener)}
            >
              <span style={{ ...styles.categoryIconWrap, background: cat.tint }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={cat.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  {cat.icon}
                </svg>
              </span>
              <span style={styles.categoryTextWrap}>
                <span style={styles.categoryLabel}>{cat.label}</span>
                <span style={styles.categorySub}>{cat.sub}</span>
              </span>
              <ArrowRightIcon size={15} color="var(--color-charcoal-soft)" />
            </button>
          ))}
        </div>
      </section>

      <section id="how-it-works" style={styles.howSection}>
        <h2 style={styles.sectionTitle}>How it works</h2>
        <div style={styles.howGrid}>
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} style={styles.howCard}>
              <div style={styles.howIndex}>{i + 1}</div>
              <div style={styles.howTitle}>{step.title}</div>
              <div style={styles.howDetail}>{step.detail}</div>
            </div>
          ))}
        </div>
      </section>
      <footer id="about" style={styles.footer}>
        <div style={styles.footerRow}>
          <div style={styles.footerBrand}>
            <Logo size={26} />
            <span style={styles.footerBrandText}>Yojana Mitra</span>
          </div>
          <p style={styles.footerText}>
            Currently covering Madhya Pradesh state schemes and major central government
            schemes. Built for citizens who deserve a simpler way to access what they're
            entitled to.
          </p>
        </div>
        <div style={styles.footerBottom}>
          <span>Better information</span>
          <span style={styles.footerDivider}>→</span>
          <span>Greater opportunities</span>
          <span style={styles.footerDivider}>→</span>
          <strong style={{ color: 'var(--color-forest)' }}>A stronger India</strong>
        </div>
      </footer>

      <button style={styles.helpFab} onClick={() => setHelpOpen((h) => !h)} title="Help">
        <HelpCircleIcon size={20} color="var(--color-cream)" />
      </button>
      {helpOpen && (
        <div style={styles.helpPopover}>
          <strong style={{ color: 'var(--color-forest)' }}>Need a hand?</strong>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--color-charcoal-soft)', lineHeight: 1.5 }}>
            Tap "Find My Schemes" and just talk or type naturally — Yojana Mitra will ask
            you simple questions and figure out the rest.
          </p>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    color: 'var(--color-charcoal)',
    fontFamily: 'var(--font-body)',
    position: 'relative',
  },
  fieldBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, var(--color-forest) 0%, var(--color-marigold) 50%, var(--color-forest) 100%)',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px clamp(20px, 5vw, 48px)',
    gap: '16px',
    flexWrap: 'wrap',
  },
  navBrand: { display: 'flex', alignItems: 'center', gap: '10px' },
  navTitle: { fontSize: '17px', fontWeight: 700, color: 'var(--color-forest)', lineHeight: 1.15 },
  navSubtitle: { fontSize: '11px', color: 'var(--color-charcoal-soft)' },
  navLinks: { display: 'flex', gap: '26px' },
  navLink: { color: 'var(--color-charcoal)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 },
  navActions: { display: 'flex', alignItems: 'center', gap: '12px' },
  langPill: {
    display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12.5px',
    color: 'var(--color-charcoal-soft)', border: '1px solid rgba(20,83,45,0.18)',
    borderRadius: '999px', padding: '6px 12px',
  },
  startNowBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
    borderRadius: '999px', border: 'none', background: 'var(--color-forest)',
    color: 'var(--color-cream)', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer',
  },
  hero: {
    display: 'flex',
    gap: 'clamp(24px, 5vw, 64px)',
    padding: '28px clamp(20px, 5vw, 48px) 50px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  heroText: { flex: '1 1 420px', minWidth: '300px' },
  eyebrowPill: {
    display: 'inline-block', fontSize: '12.5px', fontWeight: 700, color: 'var(--color-marigold-dark)',
    background: 'rgba(232,163,61,0.16)', padding: '6px 14px', borderRadius: '999px', marginBottom: '18px',
  },
  headline: {
    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(34px, 6vw, 52px)',
    lineHeight: 1.1, margin: '0 0 18px', color: 'var(--color-forest)',
  },
  subtext: { fontSize: '16px', lineHeight: 1.65, color: 'var(--color-charcoal-soft)', maxWidth: '480px', margin: '0 0 26px' },
  heroActions: { display: 'flex', alignItems: 'center', gap: '22px', marginBottom: '36px', flexWrap: 'wrap' },
  primaryCta: {
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 26px',
    fontSize: '15.5px', fontWeight: 700, fontFamily: 'var(--font-body)', color: 'var(--color-cream)',
    background: 'var(--color-forest)', border: 'none', borderRadius: '999px', cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(20, 83, 45, 0.28)',
  },
  secondaryCta: { fontSize: '14.5px', fontWeight: 700, color: 'var(--color-forest)', textDecoration: 'none', borderBottom: '2px solid var(--color-marigold)', paddingBottom: '2px' },
  featureRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', maxWidth: '480px' },
  featureItem: { display: 'flex', gap: '10px', alignItems: 'flex-start' },
  featureDot: { width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-marigold)', marginTop: '6px', flexShrink: 0 },
  featureLabel: { fontSize: '13.5px', fontWeight: 700, color: 'var(--color-forest)' },
  featureDetail: { fontSize: '12px', color: 'var(--color-charcoal-soft)', lineHeight: 1.4, marginTop: '1px' },
  heroVisual: { flex: '1 1 360px', minWidth: '300px', position: 'relative', display: 'flex', justifyContent: 'center' },
  heroSvg: { width: '100%', maxWidth: '420px', height: 'auto' },
  chatPreview: {
    position: 'absolute', bottom: '-18px', left: '50%', transform: 'translateX(-50%)',
    width: 'min(92%, 340px)', background: '#ffffff', borderRadius: '16px',
    padding: '16px', boxShadow: '0 16px 40px rgba(20,83,45,0.22)', border: '1px solid rgba(20,83,45,0.08)',
  },
  chatPreviewHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  chatPreviewAvatar: { width: '38px', height: '38px', borderRadius: '50%', background: 'var(--color-sage)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chatPreviewName: { fontSize: '13.5px', fontWeight: 700, color: 'var(--color-forest)' },
  chatPreviewSub: { fontSize: '11.5px', color: 'var(--color-charcoal-soft)' },
  chatPreviewChips: { display: 'flex', flexDirection: 'column', gap: '7px' },
  chatPreviewChip: {
    textAlign: 'left', fontSize: '12.5px', padding: '8px 12px', borderRadius: '10px',
    border: '1px solid rgba(20,83,45,0.15)', background: 'var(--color-sage)',
    color: 'var(--color-forest)', cursor: 'pointer', fontFamily: 'inherit',
  },
  categorySection: { padding: '10px clamp(20px, 5vw, 48px) 44px' },
  categoryHeadRow: { marginBottom: '20px' },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3vw, 28px)', color: 'var(--color-forest)', margin: '0 0 6px', fontWeight: 600 },
  sectionSubtitle: { fontSize: '14px', color: 'var(--color-charcoal-soft)', margin: 0 },
  popularSection: { padding: '10px clamp(20px, 5vw, 48px) 36px' },
  popularGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginTop: '18px' },
  popularCard: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '14px',
    border: '1px solid rgba(20,83,45,0.12)', background: '#ffffff', cursor: 'pointer',
    fontFamily: 'inherit', textAlign: 'left', transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  popularDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  popularTextWrap: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  categoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' },
  categoryCard: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '14px',
    border: '1px solid rgba(20,83,45,0.12)', background: '#ffffff', cursor: 'pointer',
    fontFamily: 'inherit', textAlign: 'left', transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  categoryIconWrap: { width: '42px', height: '42px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  categoryTextWrap: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  categoryLabel: { fontSize: '14.5px', fontWeight: 700, color: 'var(--color-charcoal)' },
  categorySub: { fontSize: '12px', color: 'var(--color-charcoal-soft)', marginTop: '2px' },
  howSection: { padding: '10px clamp(20px, 5vw, 48px) 50px' },
  howGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginTop: '20px' },
  howCard: { background: 'var(--color-sage)', borderRadius: '14px', padding: '20px 18px', border: '1px solid rgba(20,83,45,0.1)' },
  howIndex: {
    width: '30px', height: '30px', borderRadius: '50%', background: 'var(--color-forest)', color: 'var(--color-cream)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13.5px', fontWeight: 700, marginBottom: '12px',
  },
  howTitle: { fontSize: '15px', fontWeight: 700, color: 'var(--color-forest)', marginBottom: '6px' },
  howDetail: { fontSize: '13px', color: 'var(--color-charcoal-soft)', lineHeight: 1.5 },
  footer: {
    padding: '30px clamp(20px, 5vw, 48px) 26px', borderTop: '1px solid rgba(20,83,45,0.12)',
    marginTop: 'auto', background: 'rgba(255,255,255,0.5)',
  },
  footerRow: { display: 'flex', flexWrap: 'wrap', gap: '14px 40px', justifyContent: 'space-between', marginBottom: '20px' },
  footerBrand: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  footerBrandText: { fontSize: '15px', fontWeight: 700, color: 'var(--color-forest)' },
  footerText: { fontSize: '13px', color: 'var(--color-charcoal-soft)', lineHeight: 1.6, maxWidth: '460px', margin: 0 },
  footerBottom: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: 'var(--color-charcoal-soft)', flexWrap: 'wrap' },
  footerDivider: { color: 'var(--color-marigold)' },
  helpFab: {
    position: 'fixed', bottom: '22px', right: '22px', width: '48px', height: '48px', borderRadius: '50%',
    background: 'var(--color-forest)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 8px 22px rgba(20,83,45,0.35)', zIndex: 40,
  },
  helpPopover: {
    position: 'fixed', bottom: '78px', right: '22px', width: '240px', background: '#fff', borderRadius: '14px',
    padding: '14px 16px', boxShadow: '0 12px 32px rgba(20,83,45,0.25)', border: '1px solid rgba(20,83,45,0.1)', zIndex: 40,
  },
}
