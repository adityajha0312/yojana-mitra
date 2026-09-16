import Logo from './Logo'

const categories = [
  { label: 'Farmers', short: '01', icon: <path d="M12 20V8M12 8C9.2 8.4 7.5 10 7.5 13.2 10.2 13.1 12 11.7 12 8ZM12 9.2C14.7 9.5 16.5 11.2 16.5 14.1 13.8 14 12 12.5 12 9.2Z" /> },
  { label: 'Students', short: '02', icon: <path d="m4 9 8-4 8 4-8 4-8-4Zm3 2v5c2.6 2.4 7.4 2.4 10 0v-5M20 9v5" /> },
  { label: 'Women', short: '03', icon: <path d="M12 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 13v7M8.5 17h7" /> },
  { label: 'Senior Citizens', short: '04', icon: <path d="M12 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM6 20c.4-3.8 2.5-6 6-6s5.6 2.2 6 6M16.5 16.5l2 2" /> },
  { label: 'Families', short: '05', icon: <path d="M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16.5 11a2.5 2.5 0 1 0 0-5M4 20c.3-4 2-6 5-6s4.7 2 5 6M14 15c3.2-.2 5.1 1.5 5.5 5" /> },
  { label: 'Youth', short: '06', icon: <path d="M12 4 20 8 12 12 4 8l8-4ZM7 10v5c2.6 2.4 7.4 2.4 10 0v-5M20 8v6" /> },
]

const highlights = [
  ['01', 'Tell us about you', 'Share your age, work, family or situation.'],
  ['02', 'Get matched', 'See schemes that fit your profile.'],
  ['03', 'Know what to do', 'Documents, benefits and application steps.'],
]

export default function LandingPage({ onStart }) {
  return (
    <div className="ym-landing">
      <div className="ym-noise" />
      <div className="ym-orb ym-orb-one" />
      <div className="ym-orb ym-orb-two" />

      <nav className="ym-landing-nav">
        <div className="ym-brand">
          <div className="ym-brand-mark"><Logo size={42} /></div>
          <div>
            <div className="ym-brand-name">Yojana <span>Mitra</span></div>
            <div className="ym-brand-caption">Your scheme companion</div>
          </div>
        </div>
        <div className="ym-nav-trust"><span className="ym-live-dot" /> Made for citizens</div>
      </nav>

      <main className="ym-landing-main">
        <section className="ym-hero-copy">
          <div className="ym-eyebrow"><span>✦</span> Government schemes, made simple</div>

          <h1>
            Benefits you deserve.
            <br />
            <em>Guidance you can trust.</em>
          </h1>

          <p className="ym-hero-text">
            Yojana Mitra helps you discover government schemes that may fit your life —
            then shows you the benefit, documents and next steps in plain language.
          </p>

          <div className="ym-hero-actions">
            <button className="ym-hero-cta" onClick={onStart}>
              <span>Find my schemes</span>
              <span className="ym-arrow">→</span>
            </button>

            <div className="ym-voice-note">
              <span className="ym-wave">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
              Type or speak naturally
            </div>
          </div>

          <div className="ym-mini-trust">
            <span><b>✓</b> MP + Central schemes</span>
            <span><b>✓</b> Simple explanations</span>
            <span><b>✓</b> Voice friendly</span>
          </div>
        </section>

        <section className="ym-hero-card" aria-label="How Yojana Mitra works">
          <div className="ym-card-glow" />

          <div className="ym-card-topline">
            <span className="ym-chip">
              <span className="ym-pulse-dot" />
              AI scheme guide
            </span>

            <span className="ym-card-menu">•••</span>
          </div>

          <div className="ym-assistant-intro">
            <div className="ym-assistant-avatar">
              <Logo size={48} />
            </div>

            <div>
              <strong>Namaste! I'm Yojana Mitra.</strong>
              <span>Let's find what you may be eligible for.</span>
            </div>
          </div>

          <div className="ym-profile-card">
            <div className="ym-profile-label">
              A simple conversation
            </div>

            <div className="ym-message user">
              I'm a farmer with 2 acres of land.
            </div>

            <div className="ym-message assistant">
              <span className="ym-tick">✓</span>
              I can help you explore relevant schemes.
            </div>
          </div>

          <div className="ym-match-card">
            <div className="ym-match-icon">✦</div>

            <div className="ym-match-copy">
              <span>Potential matches</span>
              <strong>Personalised for you</strong>
            </div>

            <div className="ym-match-bars">
              <i />
              <i />
              <i />
            </div>
          </div>

          <div className="ym-card-footer">
            <span>🔒 Your answers stay private</span>
            <span>Works on mobile</span>
          </div>
        </section>
      </main>

      <section className="ym-how">
        <div className="ym-section-heading">
          <span>HOW IT WORKS</span>
          <h2>From confusion to clarity.</h2>
        </div>

        <div className="ym-steps">
          {highlights.map(([number, title, text]) => (
            <div className="ym-step" key={number}>
              <span className="ym-step-number">{number}</span>

              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ym-categories">
        <div className="ym-category-heading">
          <span>BUILT FOR REAL LIFE</span>
          <h2>Start with what describes you.</h2>
        </div>

        <div className="ym-category-grid">
          {categories.map((cat) => (
            <button
              className="ym-category"
              key={cat.label}
              onClick={onStart}
            >
              <span className="ym-category-number">
                {cat.short}
              </span>

              <span className="ym-category-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.55"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {cat.icon}
                </svg>
              </span>

              <span>{cat.label}</span>

              <span className="ym-category-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>

      <footer className="ym-landing-footer">
        <div className="ym-footer-brand">
          <Logo size={30} />
          <strong>Yojana Mitra</strong>
        </div>

        <span>
          Helping citizens navigate government benefits with clarity.
        </span>

        <span>© 2026</span>
      </footer>
    </div>
  )
}
