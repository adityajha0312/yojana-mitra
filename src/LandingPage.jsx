import Logo from './Logo'

const categories = [
  {
    title: 'Farmers',
    desc: 'Kisan Samman, crop support & more',
    icon: '🌾',
  },
  {
    title: 'Students',
    desc: 'Scholarships, education & careers',
    icon: '🎓',
  },
  {
    title: 'Women',
    desc: 'Safety, empowerment & welfare',
    icon: '👩',
  },
  {
    title: 'Senior Citizens',
    desc: 'Pension, healthcare & support',
    icon: '❤️',
  },
  {
    title: 'Families',
    desc: 'Housing, ration & essential support',
    icon: '🏠',
  },
  {
    title: 'Youth',
    desc: 'Skills, employment & opportunities',
    icon: '🚀',
  },
]

export default function LandingPage({ onStart }) {
  return (
    <div className="ym-new-landing">

      {/* TOP NAVIGATION */}
      <header className="ym-new-nav">

        <div className="ym-new-brand">
          <div className="ym-new-logo">
            <Logo size={45} />
          </div>

          <div>
            <div className="ym-new-brand-name">
              Yojana <span>Mitra</span>
            </div>
            <div className="ym-new-brand-sub">
              Your Government Scheme Companion
            </div>
          </div>
        </div>

        <nav className="ym-new-nav-links">
          <a href="#home">Home</a>
          <a href="#schemes">Schemes</a>
          <a href="#how">How It Works</a>
          <a href="#about">About</a>
        </nav>

        <div className="ym-new-nav-right">
          <span className="ym-language">
            🌐 English ▾
          </span>

          <button
            className="ym-nav-start"
            onClick={onStart}
          >
            Start Now →
          </button>
        </div>

      </header>


      {/* HERO */}
      <main id="home" className="ym-new-hero">

        <section className="ym-new-hero-left">

          <div className="ym-new-badge">
            ✦ Government Schemes • One Platform • For You
          </div>

          <h1>
            Your Dreams.
            <br />
            <span>Our Schemes.</span>
          </h1>

          <p className="ym-new-description">
            Yojana Mitra helps you discover government schemes that
            may match your profile — with simple explanations,
            eligibility guidance, required documents and application
            steps in a language you understand.
          </p>

          {/* FEATURES */}
          <div className="ym-feature-row">

            <div className="ym-feature">
              <span>⚡</span>
              <div>
                <strong>Easy to Understand</strong>
                <small>Simple information</small>
              </div>
            </div>

            <div className="ym-feature">
              <span>✦</span>
              <div>
                <strong>Personalised</strong>
                <small>Recommendations</small>
              </div>
            </div>

            <div className="ym-feature">
              <span>🎙</span>
              <div>
                <strong>Voice Support</strong>
                <small>Speak naturally</small>
              </div>
            </div>

            <div className="ym-feature">
              <span>🛡</span>
              <div>
                <strong>Secure & Reliable</strong>
                <small>Citizen focused</small>
              </div>
            </div>

          </div>

          <div className="ym-new-actions">

            <button
              className="ym-primary-button"
              onClick={onStart}
            >
              Find My Schemes
              <span>→</span>
            </button>

            <button
              className="ym-secondary-button"
              onClick={onStart}
            >
              ▶ How It Works
            </button>

          </div>

          <div className="ym-trust-row">
            <span>✓ Central Government</span>
            <span>✓ Madhya Pradesh</span>
            <span>✓ Voice Friendly</span>
            <span>✓ Mobile Ready</span>
          </div>

        </section>


        {/* HERO RIGHT */}
        <section className="ym-new-hero-right">

          <div className="ym-hero-glow" />

          <div className="ym-citizen-illustration">

            <div className="ym-sun" />

            <div className="ym-landscape">
              <span className="ym-tree tree-one">🌳</span>
              <span className="ym-tree tree-two">🌳</span>
              <span className="ym-tree tree-three">🌳</span>
            </div>

            <div className="ym-citizens">

              <div className="ym-person">
                <div className="ym-person-head">👩</div>
                <div className="ym-person-body orange" />
              </div>

              <div className="ym-person">
                <div className="ym-person-head">👨</div>
                <div className="ym-person-body blue" />
              </div>

              <div className="ym-person">
                <div className="ym-person-head">👴</div>
                <div className="ym-person-body cream" />
              </div>

              <div className="ym-person">
                <div className="ym-person-head">👧</div>
                <div className="ym-person-body purple" />
              </div>

            </div>

            <div className="ym-india-message">
              <strong>Sarkari Yojanaon</strong>
              <span>ka Sahi Margdarshak</span>
            </div>

          </div>


          {/* CHAT PREVIEW */}
          <div className="ym-launch-chat">

            <div className="ym-launch-chat-head">

              <div className="ym-launch-avatar">
                <Logo size={42} />
              </div>

              <div>
                <strong>Namaste! I'm Yojana Mitra 👋</strong>
                <span>Let's find what you may be eligible for.</span>
              </div>

              <div className="ym-online-dot" />

            </div>

            <div className="ym-suggestion-row">
              <button onClick={onStart}>
                I'm a farmer with 2 acres
              </button>

              <button onClick={onStart}>
                I'm a student
              </button>

              <button onClick={onStart}>
                I need business support
              </button>
            </div>

            <button
              className="ym-launch-input"
              onClick={onStart}
            >
              <span>🌐</span>
              Ask, Type or Speak — I'll guide you.
              <b>🎙</b>
            </button>

          </div>

        </section>

      </main>


      {/* SCHEME CATEGORIES */}
      <section
        id="schemes"
        className="ym-new-section"
      >

        <div className="ym-section-title">
          <span>EXPLORE SCHEMES</span>

          <h2>
            Find support for your situation.
          </h2>

          <p>
            Choose a category that describes you and let Yojana Mitra
            help you explore relevant government schemes.
          </p>
        </div>


        <div className="ym-category-cards">

          {categories.map((category) => (
            <button
              key={category.title}
              className="ym-big-category"
              onClick={onStart}
            >

              <div className="ym-category-icon">
                {category.icon}
              </div>

              <div className="ym-category-content">
                <strong>{category.title}</strong>
                <span>{category.desc}</span>
              </div>

              <span className="ym-category-arrow">
                →
              </span>

            </button>
          ))}

        </div>

      </section>


      {/* HOW IT WORKS */}
      <section
        id="how"
        className="ym-how-section"
      >

        <div className="ym-section-title centered">
          <span>HOW IT WORKS</span>

          <h2>
            From confusion to clarity.
          </h2>

          <p>
            Getting information about government schemes doesn't
            have to be complicated.
          </p>
        </div>


        <div className="ym-process">

          <div className="ym-process-card">
            <div className="ym-process-number">01</div>
            <div className="ym-process-icon">👤</div>
            <h3>Tell us about yourself</h3>
            <p>
              Share your age, occupation, family situation,
              education or other relevant details.
            </p>
          </div>

          <div className="ym-process-line" />

          <div className="ym-process-card">
            <div className="ym-process-number">02</div>
            <div className="ym-process-icon">✦</div>
            <h3>Get relevant schemes</h3>
            <p>
              Yojana Mitra analyses your information and
              highlights schemes that may fit your situation.
            </p>
          </div>

          <div className="ym-process-line" />

          <div className="ym-process-card">
            <div className="ym-process-number">03</div>
            <div className="ym-process-icon">📄</div>
            <h3>Know your next step</h3>
            <p>
              Understand benefits, eligibility, documents
              and how to apply.
            </p>
          </div>

        </div>

      </section>


      {/* FINAL CTA */}
      <section className="ym-final-cta">

        <div>
          <span>READY TO GET STARTED?</span>

          <h2>
            Your next opportunity
            <br />
            may be one conversation away.
          </h2>
        </div>

        <button onClick={onStart}>
          Find My Schemes →
        </button>

      </section>


      {/* FOOTER */}
      <footer className="ym-new-footer">

        <div className="ym-footer-logo">
          <Logo size={35} />
          <div>
            <strong>Yojana Mitra</strong>
            <span>Your Scheme Companion</span>
          </div>
        </div>

        <p>
          Helping citizens understand and navigate government
          benefits with clarity.
        </p>

        <span>
          © 2026 Yojana Mitra
        </span>

      </footer>

    </div>
  )
}
