import { useState, useEffect, useRef } from 'react'
import { fetchAllSchemes } from './lib/supabase'
import { askGemini } from './lib/gemini'
import { startListening, speakText, stopSpeaking, isVoiceInputSupported, isVoiceOutputSupported } from './lib/speech'
import { subscribeToConnectionStatus, isCurrentlyOnline, getCacheAge, getSchemesFromCache } from './lib/offline'
import Logo from './Logo'
import { MicIcon, StopIcon, SpeakerOnIcon, SpeakerOffIcon } from './Icons'
import ApplicationForm from './ApplicationForm'
import LandingPage from './LandingPage'

const QUICK_LINKS = [
  { label: 'PM-KISAN', url: 'https://pmkisan.gov.in' },
  { label: 'Ayushman Bharat', url: 'https://beneficiary.nha.gov.in' },
  { label: 'MP Scholarship Portal', url: 'https://hescholarship.mp.gov.in' },
  { label: 'MP Social Security', url: 'https://socialsecurity.mp.gov.in' },
  { label: 'PM Awas Yojana', url: 'https://pmayg.dord.gov.in' },
]

function renderInline(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>
  })
}

function MessageContent({ text }) {
  const lines = text.split('\n')
  const blocks = []
  let currentList = []

  function flushList(key) {
    if (currentList.length > 0) {
      blocks.push(
        <ul key={`ul-${key}`} style={{ margin: '4px 0', paddingLeft: '20px' }}>
          {currentList.map((line, i) => (
            <li key={i} style={{ marginBottom: '3px' }}>
              {renderInline(line.replace(/^[*\-]\s+/, ''), `li-${key}-${i}`)}
            </li>
          ))}
        </ul>
      )
      currentList = []
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (/^[*\-]\s+/.test(trimmed) && !/^\*\*/.test(trimmed)) {
      currentList.push(trimmed)
    } else {
      flushList(idx)
      if (trimmed === '') {
        blocks.push(<div key={idx} style={{ height: '6px' }} />)
      } else {
        blocks.push(<div key={idx}>{renderInline(line, `p-${idx}`)}</div>)
      }
    }
  })
  flushList('end')

  return <>{blocks}</>
}

// Lightweight keyword matching to guess which scheme categories are
// relevant based on the conversation so far - just narrows Gemini's
// attention to a smaller, clearly-labeled "likely relevant" subset.
const CATEGORY_KEYWORDS = {
  farmer: ['farmer', 'farming', 'kisan', 'agricultur', 'land', 'acre', 'hectare', 'crop', 'khet'],
  student: ['student', 'scholarship', 'school', 'college', 'class ', 'study', 'studying', 'graduate', 'education'],
  woman: ['woman', 'women', 'girl', 'daughter', 'wife', 'mother', 'pregnan', 'widow', 'ladli'],
  senior: ['senior', 'old age', 'elderly', '60 year', '65 year', '70 year', 'retire'],
  disability: ['disab', 'divyang', 'handicap'],
  youth: ['unemployed', 'youth', 'jobless', 'no job', 'looking for work', 'fresher', 'unemploy'],
  general: ['bpl', 'poor', 'ration card', 'below poverty', 'house', 'housing', 'lpg', 'gas connection', 'hospital', 'health insurance'],
}

function guessRelevantCategories(conversationText) {
  const lower = conversationText.toLowerCase()
  const matched = new Set(['general'])
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.add(category)
    }
  }
  return matched
}

function buildSystemInstruction(schemes, conversationText) {
  const relevantCategories = guessRelevantCategories(conversationText)
  const likelyRelevant = schemes.filter((s) => relevantCategories.has(s.category))
  const others = schemes.filter((s) => !relevantCategories.has(s.category))

  const formatScheme = (s) => `
- ${s.scheme_name} (${s.scheme_name_hindi || ''}) [${s.category}, ${s.level}]
  Eligibility: ${JSON.stringify(s.eligibility_criteria)}
  Benefits: ${s.benefits}
  Documents: ${JSON.stringify(s.documents_required)}
  How to apply: ${s.how_to_apply}`

  return `You are Yojana Mitra, a friendly assistant that helps Indian citizens (especially in Madhya Pradesh) find government schemes they may be eligible for.

LIKELY RELEVANT SCHEMES based on the conversation so far - check these carefully first, they are probably what this person needs:
${likelyRelevant.map(formatScheme).join('\n')}

OTHER SCHEMES in the database (less likely to apply here, but check if the person's situation shifts):
${others.map(formatScheme).join('\n')}

HOW TO RESPOND:
1. If you don't yet have enough details to check eligibility, ask 1-2 short friendly clarifying questions (occupation, age, land, income, gender, etc.).
2. Once you have enough details, recommend the schemes above that clearly match - explain briefly why they qualify, the benefit amount, documents needed, and how to apply, all taken from the details given above. Be confident, not hesitant - a farmer with small landholding, for example, normally qualifies for multiple schemes on this list at once.
3. You may also mention a real Indian government scheme you know about that is NOT in the list above, if it genuinely seems relevant - but you MUST clearly label it as unverified, for example: "Note: [Scheme Name] is not in my verified database, so please confirm the current details with an official source before relying on it." Never state facts about an unlisted scheme (amounts, eligibility, documents) with the same confidence as a listed one - always flag it as unverified information, separate from your verified recommendations.
4. Only say "I don't have a verified scheme for your situation" if you've genuinely checked the list and nothing fits - not by default. If you know of an unverified scheme per rule 3, mention it there instead; otherwise suggest the National Scholarship Portal, nearest Common Service Centre (CSC), or relevant district office.
5. Say "Namaste" only in your first reply. Keep replies concise, warm, and easy to read on a phone. Bold only scheme names and key numbers. Match the user's language (English/Hindi/Hinglish).
6. Stay strictly in scope: you only help with Indian government schemes and the person's eligibility for them. If asked something unrelated (celebrities, general trivia, coding help, other countries, etc.), do NOT answer it - politely say that's outside what you help with, briefly state your actual purpose, and ask if they'd like help finding a scheme instead. Never answer the off-topic question itself, even partially.`
}

function Welcome() {
  return {
    role: 'assistant',
    text: "Namaste! I'm Yojana Mitra. Tell me a bit about yourself — your occupation, age, or situation — and I'll help you find government schemes you may be eligible for.",
  }
}

export default function App() {
  const [started, setStarted] = useState(false)
  const [schemes, setSchemes] = useState(() => getSchemesFromCache() || [])
  const [messages, setMessages] = useState([Welcome()])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSchemes, setLoadingSchemes] = useState(true)
  const [error, setError] = useState(null)
  const [showLinks, setShowLinks] = useState(false)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceLang, setVoiceLang] = useState('en-IN')
  const [speakEnabled, setSpeakEnabled] = useState(false)
  const listenControllerRef = useRef(null)
  const [isOnline, setIsOnline] = useState(isCurrentlyOnline())
  const [usingCachedSchemes, setUsingCachedSchemes] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchAllSchemes().then(({ schemes, fromCache }) => {
      if (schemes.length === 0) {
        // First attempt came back empty (likely a transient network hiccup) -
        // automatically retry once after a short delay before giving up.
        setTimeout(() => {
          fetchAllSchemes().then((retryResult) => {
            setSchemes(retryResult.schemes)
            setUsingCachedSchemes(retryResult.fromCache)
            setLoadingSchemes(false)
          })
        }, 2000)
      } else {
        setSchemes(schemes)
        setUsingCachedSchemes(fromCache)
        setLoadingSchemes(false)
      }
    })
  }, [])

  function retryLoadSchemes() {
    fetchAllSchemes().then(({ schemes, fromCache }) => {
      setSchemes(schemes)
      setUsingCachedSchemes(fromCache)
      setLoadingSchemes(false)
    })
  }

  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus((online) => {
      setIsOnline(online)
      if (online) {
        // Reconnected - fetch fresh scheme data in the background
        fetchAllSchemes().then(({ schemes, fromCache }) => {
          setSchemes(schemes)
          setUsingCachedSchemes(fromCache)
        })
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, isOnline])

  async function handleSend(overrideText) {
    const textToSend = (overrideText ?? input).trim()
    if (!textToSend || loading) return

    if (!isOnline) {
      setError("You're offline right now, so I can't think through scheme matches - that needs an internet connection. You can still browse the saved scheme list below. I'll be ready to chat again as soon as you're back online.")
      return
    }

    const userMessage = { role: 'user', text: textToSend }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const conversationText = newMessages.map((m) => m.text).join(' ')
      const systemInstruction = buildSystemInstruction(schemes, conversationText)
      const replyText = await askGemini(systemInstruction, newMessages)
      setMessages([...newMessages, { role: 'assistant', text: replyText }])
      if (speakEnabled) {
        speakText(replyText, voiceLang)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleClearChat() {
    setMessages([Welcome()])
    setError(null)
    setShowLinks(false)
    stopSpeaking()
  }

  function handleMicClick() {
    if (isListening) {
      listenControllerRef.current?.stop()
      setIsListening(false)
      return
    }
    stopSpeaking()
    setIsListening(true)
    listenControllerRef.current = startListening({
      lang: voiceLang,
      onResult: (transcript, isFinal) => {
        setInput(transcript)
        if (isFinal && transcript.trim()) {
          setIsListening(false)
          handleSend(transcript)
        }
      },
      onEnd: () => {
        setIsListening(false)
      },
      onError: (err) => {
        setIsListening(false)
        if (err !== 'no-speech' && err !== 'aborted') {
          setError(`Voice input error: ${err}`)
        }
      },
    })
  }

  useEffect(() => {
    return () => stopSpeaking()
  }, [])

  return (
  <div className="ym-app-shell">

    {/* SIDEBAR */}
    <aside className="ym-sidebar">

      <div className="ym-sidebar-brand">
        <Logo size={42} />

        <div>
          <strong>Yojana Mitra</strong>
          <span>Your Scheme Companion</span>
        </div>
      </div>


      <button
        className="ym-new-chat-button"
        onClick={handleClearChat}
      >
        <span>＋</span>
        New Chat
      </button>


      <nav className="ym-sidebar-nav">

        <button className="active">
          <span>⌂</span>
          Home
        </button>

        <button onClick={() => setShowLinks(true)}>
          <span>▦</span>
          Schemes
        </button>

        <button onClick={() => setShowApplyForm(true)}>
          <span>▤</span>
          My Applications
        </button>

        <button>
          <span>♡</span>
          Saved Schemes
        </button>

        <button>
          <span>♙</span>
          Profile
        </button>

        <button>
          <span>⚙</span>
          Settings
        </button>

      </nav>


      {/* SIDEBAR HELP */}
      <div className="ym-sidebar-help">

        <div className="ym-help-avatar">
          <Logo size={52} />
        </div>

        <strong>Need help?</strong>

        <p>
          Use voice, type or ask in your preferred language.
        </p>

        {isVoiceInputSupported && (
          <button onClick={handleMicClick}>
            🎙 Try Voice
          </button>
        )}

      </div>


      <div className="ym-sidebar-status">

        <span className={isOnline ? 'online' : 'offline'} />

        <div>
          <strong>
            {isOnline ? 'Online' : 'Offline'}
          </strong>

          <small>
            {isOnline
              ? 'All features working'
              : 'Limited offline mode'}
          </small>
        </div>

      </div>

    </aside>


    {/* MAIN APPLICATION */}
    <section className="ym-app-main">

      {/* TOP BAR */}
      <header className="ym-app-topbar">

        <div className="ym-topbar-search">
          <span>⌕</span>

          <input
            placeholder="Search schemes, benefits, or ask a question..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                handleSend(e.target.value)
                e.target.value = ''
              }
            }}
          />
        </div>


        <div className="ym-topbar-actions">

          {isVoiceInputSupported && (
            <button
              onClick={() =>
                setVoiceLang((l) =>
                  l === 'en-IN' ? 'hi-IN' : 'en-IN'
                )
              }
            >
              🌐 {voiceLang === 'en-IN' ? 'English' : 'हिन्दी'}
            </button>
          )}

          {isVoiceOutputSupported && (
            <button
              onClick={() => {
                if (speakEnabled) stopSpeaking()
                setSpeakEnabled((s) => !s)
              }}
            >
              {speakEnabled ? '🔊' : '🔇'}
            </button>
          )}

          <button
            onClick={() => setShowApplyForm(true)}
          >
            Apply
          </button>

          <button onClick={handleClearChat}>
            ↻
          </button>

        </div>

      </header>


      {/* OFFLINE */}
      {!isOnline && (
        <div className="ym-modern-offline">
          <span>⚠</span>

          You're offline. Saved scheme information is available,
          but AI matching requires an internet connection.

          {usingCachedSchemes &&
            ' Showing your saved scheme data.'}
        </div>
      )}


      {/* OFFICIAL LINKS */}
      {showLinks && (
        <div className="ym-modern-links">

          <strong>Official Government Resources</strong>

          <div>
            {QUICK_LINKS.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label} →
              </a>
            ))}
          </div>

        </div>
      )}


      {/* CONTENT */}
      <main className="ym-dashboard">

        {/* CHAT COLUMN */}
        <section className="ym-chat-panel">

          <div className="ym-chat-header">

            <div className="ym-chat-identity">

              <div className="ym-chat-avatar">
                <Logo size={43} />
              </div>

              <div>
                <strong>Yojana Mitra</strong>

                <span>
                  <i />
                  Government Scheme Assistant
                </span>
              </div>

            </div>


            <div className="ym-chat-header-actions">

              <button onClick={handleClearChat}>
                + New Chat
              </button>

              <button
                onClick={() => setShowApplyForm(true)}
              >
                Apply for Scheme
              </button>

            </div>

          </div>


          {/* CHAT BODY */}
          <div className="ym-modern-chat-body">

            {loadingSchemes ? (

              <div className="ym-chat-loading">
                <div className="ym-loading-spinner" />
                Loading verified scheme information...
              </div>

            ) : (

              <>
                {messages.map((msg, i) => (

                  <div
                    key={i}
                    className={
                      msg.role === 'user'
                        ? 'ym-modern-message user'
                        : 'ym-modern-message assistant'
                    }
                  >

                    {msg.role === 'assistant' && (
                      <div className="ym-message-avatar">
                        <Logo size={32} />
                      </div>
                    )}

                    <div className="ym-message-content">

                      {msg.role === 'assistant' && (
                        <small>YOJANA MITRA</small>
                      )}

                      <div className="ym-message-bubble">

                        {msg.role === 'assistant'
                          ? <MessageContent text={msg.text} />
                          : msg.text}

                      </div>

                      {msg.role === 'user' && (
                        <span className="ym-message-time">
                          You · Just now ✓
                        </span>
                      )}

                    </div>

                  </div>

                ))}


                {/* QUICK START OPTIONS */}
                {messages.length === 1 && !loading && (

                  <div className="ym-start-options">

                    <span>Try asking...</span>

                    <div>

                      <button
                        onClick={() =>
                          handleSend(
                            'I am a farmer with 2 acres of land'
                          )
                        }
                      >
                        🌾 I'm a farmer with 2 acres
                      </button>

                      <button
                        onClick={() =>
                          handleSend(
                            'I am a student looking for scholarship'
                          )
                        }
                      >
                        🎓 I'm a student
                      </button>

                      <button
                        onClick={() =>
                          handleSend(
                            'I need support for my business'
                          )
                        }
                      >
                        💼 I need business support
                      </button>

                      <button
                        onClick={() =>
                          handleSend(
                            'I am a senior citizen'
                          )
                        }
                      >
                        ❤️ I'm a senior citizen
                      </button>

                    </div>

                  </div>

                )}


                {loading && (

                  <div className="ym-modern-message assistant">

                    <div className="ym-message-avatar">
                      <Logo size={32} />
                    </div>

                    <div className="ym-message-content">

                      <small>YOJANA MITRA</small>

                      <div className="ym-message-bubble">
                        <span className="ym-modern-typing">
                          <i />
                          <i />
                          <i />
                        </span>
                      </div>

                    </div>

                  </div>

                )}


                {error && (
                  <div className="ym-modern-error">
                    ⚠ {error}
                  </div>
                )}


                {!isOnline && schemes.length > 0 && (

                  <div className="ym-offline-schemes">

                    <h3>
                      Saved schemes available offline
                    </h3>

                    {schemes.map((s) => (
                      <div key={s.id}>

                        <strong>
                          {s.scheme_name}
                        </strong>

                        <span>
                          {s.category} · {s.level}
                        </span>

                        <p>
                          {s.description}
                        </p>

                      </div>
                    ))}

                  </div>

                )}

                <div ref={bottomRef} />

              </>

            )}

          </div>


          {/* INPUT */}
          <div className="ym-modern-input-area">

            <button
              className="ym-add-button"
              type="button"
            >
              +
            </button>


            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !isOnline
                  ? 'Reconnect to continue chatting...'
                  : isListening
                    ? 'Listening... speak now'
                    : "Ask anything about government schemes..."
              }
              rows={1}
              disabled={loadingSchemes || !isOnline}
            />


            {isVoiceInputSupported && (
              <button
                className={
                  isListening
                    ? 'ym-modern-mic listening'
                    : 'ym-modern-mic'
                }
                onClick={handleMicClick}
                disabled={loadingSchemes || !isOnline}
              >
                {isListening
                  ? <StopIcon size={18} color="white" />
                  : <MicIcon size={19} />}
              </button>
            )}


            <button
              className="ym-modern-send"
              onClick={() => handleSend()}
              disabled={
                loading ||
                loadingSchemes ||
                !input.trim() ||
                !isOnline
              }
            >
              →
            </button>

          </div>


          <div className="ym-chat-disclaimer">
            Yojana Mitra provides guidance using available scheme
            information. Always verify final eligibility on official
            government portals.
          </div>

        </section>


        {/* RIGHT INFORMATION PANEL */}
        <aside className="ym-info-panel">

          <div className="ym-info-card">

            <div className="ym-info-card-title">
              <strong>Popular Schemes</strong>
              <button
                onClick={() => setShowLinks(true)}
              >
                View All →
              </button>
            </div>


            <div className="ym-popular-list">

              <div>
                <span>🌱</span>
                <section>
                  <strong>PM Kisan Samman Nidhi</strong>
                  <small>For Farmers</small>
                </section>
                <b>›</b>
              </div>

              <div>
                <span>🏠</span>
                <section>
                  <strong>PM Awas Yojana</strong>
                  <small>For Housing</small>
                </section>
                <b>›</b>
              </div>

              <div>
                <span>🎓</span>
                <section>
                  <strong>National Scholarship Portal</strong>
                  <small>For Students</small>
                </section>
                <b>›</b>
              </div>

              <div>
                <span>❤️</span>
                <section>
                  <strong>Ayushman Bharat</strong>
                  <small>Healthcare</small>
                </section>
                <b>›</b>
              </div>

              <div>
                <span>🔥</span>
                <section>
                  <strong>Ujjwala Yojana</strong>
                  <small>Clean Energy</small>
                </section>
                <b>›</b>
              </div>

            </div>

          </div>


          {/* IMPACT */}
          <div className="ym-impact-card">

            <div className="ym-info-card-title">
              <strong>Real Impact</strong>
            </div>

            <div className="ym-impact-grid">

              <div>
                <strong>12Cr+</strong>
                <span>Beneficiaries</span>
              </div>

              <div>
                <strong>400+</strong>
                <span>Schemes</span>
              </div>

              <div>
                <strong>100%</strong>
                <span>Transparent</span>
              </div>

            </div>

          </div>


          {/* QUICK LINKS */}
          <div className="ym-info-card">

            <div className="ym-info-card-title">
              <strong>Quick Links</strong>
            </div>

            <div className="ym-quick-links">

              <button onClick={() => setShowApplyForm(true)}>
                ✓ Check Eligibility
                <span>→</span>
              </button>

              <button onClick={() => setShowLinks(true)}>
                ▦ View All Schemes
                <span>→</span>
              </button>

              <button>
                ? Frequently Asked Questions
                <span>→</span>
              </button>

              <button>
                ☎ Contact Support
                <span>→</span>
              </button>

            </div>

          </div>


          {/* VOICE CARD */}
          <div className="ym-voice-card">

            <div className="ym-voice-card-avatar">
              <Logo size={55} />
            </div>

            <strong>
              Prefer speaking?
            </strong>

            <p>
              Ask Yojana Mitra using your voice in
              English or Hindi.
            </p>

            {isVoiceInputSupported && (
              <button onClick={handleMicClick}>
                🎙 Try Voice
              </button>
            )}

          </div>


          <div className="ym-india-card">
            <span>🇮🇳</span>

            <strong>
              Sarkari Yojanaon ka
              <br />
              Sahi Margdarshak
            </strong>

          </div>

        </aside>

      </main>

    </section>


    {showApplyForm && (
      <ApplicationForm
        schemes={schemes}
        onClose={() => setShowApplyForm(false)}
        onRetryLoadSchemes={retryLoadSchemes}
      />
    )}

  </div>
)
