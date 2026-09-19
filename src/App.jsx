import { useState, useEffect, useRef } from 'react'
import { fetchAllSchemes } from './lib/supabase'
import { askGemini } from './lib/gemini'
import { startListening, speakText, stopSpeaking, isVoiceInputSupported, isVoiceOutputSupported } from './lib/speech'
import { subscribeToConnectionStatus, isCurrentlyOnline, getCacheAge, getSchemesFromCache, getSavedSchemeIds, toggleSavedScheme } from './lib/offline'
import Logo from './Logo'
import {
  MicIcon, StopIcon, SpeakerOnIcon, SpeakerOffIcon, MenuIcon, CloseIcon, PlusChatIcon,
  GridIcon, DocumentIcon, BookmarkIcon, UserCircleIcon, SettingsGearIcon, GlobeIcon,
  SendIcon, SearchIcon,
} from './Icons'
import ApplicationForm from './ApplicationForm'
import LandingPage from './LandingPage'

const QUICK_LINKS = [
  { label: 'PM-KISAN', url: 'https://pmkisan.gov.in' },
  { label: 'Ayushman Bharat', url: 'https://beneficiary.nha.gov.in' },
  { label: 'MP Scholarship Portal', url: 'https://hescholarship.mp.gov.in' },
  { label: 'MP Social Security', url: 'https://socialsecurity.mp.gov.in' },
  { label: 'PM Awas Yojana (Gramin)', url: 'https://pmayg.nic.in' },
  { label: 'National Scholarship Portal', url: 'https://scholarships.gov.in' },
  { label: 'Ujjwala Yojana', url: 'https://www.pmuy.gov.in' },
  { label: 'e-Shram (Unorganized Workers)', url: 'https://eshram.gov.in' },
  { label: 'Jan Dhan Yojana', url: 'https://www.pmjdy.gov.in' },
  { label: 'Common Service Centre', url: 'https://csc.gov.in' },
]

function renderInline(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={`${keyPrefix}-${i}`}>{part.slice(1, -1)}</em>
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
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed)
    if (headingMatch) {
      flushList(idx)
      const level = headingMatch[1].length
      blocks.push(
        <div
          key={idx}
          style={{
            fontWeight: 700,
            color: 'var(--color-forest)',
            fontSize: level <= 2 ? '15.5px' : '14.5px',
            margin: '10px 0 4px',
          }}
        >
          {renderInline(headingMatch[2], `h-${idx}`)}
        </div>
      )
    } else if (/^[*\-]\s+/.test(trimmed) && !/^\*\*/.test(trimmed)) {
      currentList.push(trimmed)
    } else {
      flushList(idx)
      if (trimmed === '') {
        blocks.push(<div key={idx} style={{ height: '6px' }} />)
      } else if (trimmed === '--' || trimmed === '---' || trimmed === '***') {
        blocks.push(<hr key={idx} style={{ border: 'none', borderTop: '1px solid rgba(20,83,45,0.12)', margin: '8px 0' }} />)
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

// Eligibility criteria / documents required can come back from the database
// as an array, a plain object, or a single string - this renders whichever
// shape shows up as something readable, without needing a network call.
function FormattedField({ value }) {
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: 'var(--color-charcoal-soft)' }}>Not specified</span>
  }
  if (Array.isArray(value)) {
    return (
      <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
        {value.map((item, i) => (
          <li key={i} style={{ marginBottom: '2px' }}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
        ))}
      </ul>
    )
  }
  if (typeof value === 'object') {
    return (
      <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
        {Object.entries(value).map(([key, val]) => (
          <li key={key} style={{ marginBottom: '2px' }}>
            <strong>{key.replace(/_/g, ' ')}:</strong> {typeof val === 'object' ? JSON.stringify(val) : String(val)}
          </li>
        ))}
      </ul>
    )
  }
  return <span>{String(value)}</span>
}

export default function App() {
  const [started, setStarted] = useState(false)
  const [pendingOpener, setPendingOpener] = useState(null)
  const [schemes, setSchemes] = useState(() => getSchemesFromCache() || [])
  const [messages, setMessages] = useState([Welcome()])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSchemes, setLoadingSchemes] = useState(true)
  const [error, setError] = useState(null)
  const [showLinks, setShowLinks] = useState(false)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [showBrowseSchemes, setShowBrowseSchemes] = useState(false)
  const [schemeSearch, setSchemeSearch] = useState('')
  const [viewingScheme, setViewingScheme] = useState(null)
  const [savedSchemeIds, setSavedSchemeIds] = useState(() => getSavedSchemeIds())
  const [showSavedSchemes, setShowSavedSchemes] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceLang, setVoiceLang] = useState('en-IN')
  const [speakEnabled, setSpeakEnabled] = useState(false)
  const listenControllerRef = useRef(null)
  const [isOnline, setIsOnline] = useState(isCurrentlyOnline())
  const [usingCachedSchemes, setUsingCachedSchemes] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)
  const bottomRef = useRef(null)

  function showToast(message) {
    setToast(message)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 2200)
  }

  function handleStart(opener) {
    setStarted(true)
    if (opener) setPendingOpener(opener)
  }

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

  // If the user started the chat from a landing-page category card (or a
  // quick chip), fire off that opener as their first message as soon as
  // the chat is up and the scheme list has loaded.
  useEffect(() => {
    if (started && pendingOpener && !loadingSchemes) {
      const opener = pendingOpener
      setPendingOpener(null)
      handleSend(opener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, pendingOpener, loadingSchemes])

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
    setIsMobileNavOpen(false)
    stopSpeaking()
  }

  function handleComingSoon(label) {
    showToast(`${label} is coming soon`)
    setIsMobileNavOpen(false)
  }

  function handleAskAboutScheme(scheme) {
    setShowBrowseSchemes(false)
    setViewingScheme(null)
    setIsMobileNavOpen(false)
    handleSend(`Tell me more about ${scheme.scheme_name} and whether I might be eligible.`)
  }

  function openSchemeDetail(scheme) {
    setShowBrowseSchemes(false)
    setShowSavedSchemes(false)
    setIsMobileNavOpen(false)
    setViewingScheme(scheme)
  }

  function handleToggleSaved(scheme) {
    const nowSaved = toggleSavedScheme(scheme.id)
    setSavedSchemeIds(getSavedSchemeIds())
    showToast(nowSaved ? 'Saved for later' : 'Removed from saved')
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

  if (!started) {
    return <LandingPage onStart={handleStart} />
  }

  const filteredSchemes = schemes.filter((s) =>
    s.scheme_name.toLowerCase().includes(schemeSearch.toLowerCase())
  )
  const popularSchemes = schemes.slice(0, 5)
  const savedSchemesList = schemes.filter((s) => savedSchemeIds.includes(s.id))

  return (
    <div className="ym-shell">
      {isMobileNavOpen && <div className="ym-shell-scrim" onClick={() => setIsMobileNavOpen(false)} />}

      {/* Left sidebar: brand + primary navigation */}
      <aside className={`ym-shell-left${isMobileNavOpen ? ' ym-open' : ''}`} style={styles.sidebarLeft}>
        <div style={styles.sidebarBrand}>
          <Logo size={30} />
          <div>
            <div style={styles.sidebarBrandTitle}>Yojana Mitra</div>
            <div style={styles.sidebarBrandSub}>Your Scheme Companion</div>
          </div>
          <button className="ym-mobile-close-btn" style={styles.mobileCloseBtn} onClick={() => setIsMobileNavOpen(false)} aria-label="Close menu">
            <CloseIcon size={16} color="var(--color-cream)" />
          </button>
        </div>

        <button className="ym-nav-item ym-nav-active" onClick={handleClearChat} style={{ marginTop: '6px' }}>
          <PlusChatIcon size={16} /> New Chat
        </button>

        <div style={styles.sidebarSectionLabel}>Browse</div>
        <button className="ym-nav-item" onClick={() => { setShowBrowseSchemes(true); setIsMobileNavOpen(false) }}>
          <GridIcon size={16} /> Schemes
        </button>
        <button className="ym-nav-item" onClick={() => { setShowApplyForm(true); setIsMobileNavOpen(false) }}>
          <DocumentIcon size={16} /> My Applications
        </button>
        <button className="ym-nav-item" onClick={() => { setShowSavedSchemes(true); setIsMobileNavOpen(false) }}>
          <BookmarkIcon size={16} /> Saved Schemes
        </button>

        <div style={styles.sidebarSectionLabel}>Account</div>
        <button className="ym-nav-item" onClick={() => handleComingSoon('Profile')}>
          <UserCircleIcon size={16} /> Profile
        </button>
        <button className="ym-nav-item" onClick={() => handleComingSoon('Settings')}>
          <SettingsGearIcon size={16} /> Settings
        </button>
        <button className="ym-nav-item" onClick={() => { setShowLinks((s) => !s); setIsMobileNavOpen(false) }}>
          <GlobeIcon size={16} /> Official Sites
        </button>
        <button className="ym-nav-item" onClick={() => { setShowApplyForm(true); setIsMobileNavOpen(false) }}>
          <DocumentIcon size={16} /> Apply for Scheme
        </button>

        <div style={styles.sidebarHelp}>
          <div style={styles.sidebarHelpAvatar}><Logo size={20} /></div>
          <div style={styles.sidebarHelpTitle}>Need help?</div>
          <div style={styles.sidebarHelpText}>Use voice, type, or ask in your preferred language.</div>
          {isVoiceInputSupported && (
            <button
              className={isListening ? 'ym-mic-btn ym-mic-active' : 'ym-nav-item'}
              style={styles.sidebarVoiceBtn}
              onClick={() => { handleMicClick(); setIsMobileNavOpen(false) }}
              disabled={loadingSchemes || !isOnline}
            >
              <MicIcon size={14} color={isListening ? 'white' : 'var(--color-cream)'} /> {isListening ? 'Listening...' : 'Try Voice'}
            </button>
          )}
        </div>
      </aside>

      {/* Main chat column */}
      <div style={styles.mainCol}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button className="ym-mobile-menu-btn" style={styles.mobileMenuBtn} onClick={() => setIsMobileNavOpen(true)} aria-label="Open menu">
              <MenuIcon size={19} color="var(--color-cream)" />
            </button>
            <div>
              <h1 style={styles.title}>Yojana Mitra</h1>
              <p style={styles.subtitle}>
                <span style={{ ...styles.statusDot, background: isOnline ? '#3fbf6b' : '#c97f1e' }} />
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <div style={styles.headerActions}>
            {isVoiceInputSupported && (
              <button
                className="ym-icon-btn"
                onClick={() => setVoiceLang((l) => (l === 'en-IN' ? 'hi-IN' : 'en-IN'))}
                title="Voice input language"
              >
                {voiceLang === 'en-IN' ? 'EN' : 'हिं'}
              </button>
            )}
            {isVoiceOutputSupported && (
              <button
                className="ym-icon-btn"
                onClick={() => {
                  if (speakEnabled) stopSpeaking()
                  setSpeakEnabled((s) => !s)
                }}
                title="Read replies aloud"
              >
                {speakEnabled ? <SpeakerOnIcon size={15} /> : <SpeakerOffIcon size={15} />}
                {speakEnabled ? ' On' : ' Off'}
              </button>
            )}
          </div>
        </header>

        {!isOnline && (
          <div style={styles.offlineBanner}>
            You're offline — chat needs internet to think through scheme matches. Browse the saved scheme list below, or reconnect to keep chatting.
            {usingCachedSchemes && ` (Showing scheme data saved from your last connection.)`}
          </div>
        )}

        {showLinks && (
          <div style={styles.linksBar}>
            {QUICK_LINKS.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ym-link-pill"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        <div style={styles.chatArea}>
          {loadingSchemes ? (
            <p style={styles.systemNote}>Loading scheme database...</p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className="ym-bubble"
                style={{
                  ...styles.bubble,
                  ...(msg.role === 'user' ? styles.userBubble : styles.assistantBubble),
                }}
              >
                {msg.role === 'assistant' ? <MessageContent text={msg.text} /> : msg.text}
              </div>
            ))
          )}
          {loading && (
            <div style={{ ...styles.bubble, ...styles.assistantBubble }} className="ym-bubble">
              <span className="ym-typing">
                <span></span><span></span><span></span>
              </span>
            </div>
          )}
          {error && <div style={styles.errorNote}>⚠️ {error}</div>}
          {!isOnline && schemes.length > 0 && (
            <div style={styles.offlineSchemeList}>
              <p style={styles.offlineListTitle}>Saved schemes you can browse offline — tap one for eligibility & how to apply:</p>
              {schemes.map((s) => (
                <button key={s.id} className="ym-scheme-row" style={styles.offlineSchemeItem} onClick={() => openSchemeDetail(s)}>
                  <span style={{ display: 'block' }}>
                    <strong>{s.scheme_name}</strong>
                    <div style={styles.offlineSchemeCategory}>{s.category} · {s.level}</div>
                    <div>{s.description}</div>
                  </span>
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={styles.inputArea}>
          {isVoiceInputSupported && (
            <button
              className={isListening ? 'ym-mic-btn ym-mic-active' : 'ym-mic-btn'}
              onClick={handleMicClick}
              disabled={loadingSchemes || !isOnline}
              title={isListening ? 'Stop listening' : 'Speak your message'}
              type="button"
            >
              {isListening ? <StopIcon size={17} color="white" /> : <MicIcon size={18} />}
            </button>
          )}
          <textarea
            style={styles.textInput}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={!isOnline ? 'Reconnect to internet to keep chatting...' : isListening ? 'Listening... speak now' : "Type your message... (e.g. 'I am a farmer with 2 acres of land')"}
            rows={2}
            disabled={loadingSchemes || !isOnline}
          />
          <button
            className="ym-send-btn"
            style={styles.sendButton}
            onClick={() => handleSend()}
            disabled={loading || loadingSchemes || !input.trim() || !isOnline}
            aria-label="Send"
          >
            <SendIcon size={16} color="var(--color-cream)" />
          </button>
        </div>
      </div>

      {/* Right sidebar: popular schemes drawn from live data */}
      <aside className="ym-shell-right" style={styles.sidebarRight}>
        <div style={styles.rightCard}>
          <div style={styles.rightCardHeader}>
            <span>Popular Schemes</span>
            <button style={styles.viewAllBtn} onClick={() => setShowBrowseSchemes(true)}>View All</button>
          </div>
          {loadingSchemes ? (
            <p style={styles.systemNote}>Loading...</p>
          ) : popularSchemes.length === 0 ? (
            <p style={{ fontSize: '12.5px', color: 'var(--color-charcoal-soft)' }}>No schemes loaded yet.</p>
          ) : (
            popularSchemes.map((s) => (
              <button key={s.id} className="ym-scheme-row" onClick={() => openSchemeDetail(s)}>
                <span style={styles.schemeRowDot} />
                <span>
                  <span style={styles.schemeRowName}>{s.scheme_name}</span>
                  <span style={styles.schemeRowCategory}>{s.category}</span>
                </span>
              </button>
            ))
          )}
        </div>
        <div style={styles.promoCard}>
          <strong style={{ fontSize: '13.5px' }}>Many schemes. One platform.</strong>
          <p style={{ fontSize: '12px', margin: '6px 0 0', opacity: 0.9 }}>Yojana Mitra — always with you.</p>
        </div>
      </aside>

      {showApplyForm && (
        <ApplicationForm schemes={schemes} onClose={() => setShowApplyForm(false)} onRetryLoadSchemes={retryLoadSchemes} />
      )}

      {showBrowseSchemes && (
        <div style={styles.overlay} onClick={() => setShowBrowseSchemes(false)}>
          <div style={styles.browseModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>All Schemes</h2>
              <button style={styles.browseCloseBtn} onClick={() => setShowBrowseSchemes(false)}>
                <CloseIcon size={17} />
              </button>
            </div>
            <div style={styles.browseSearchRow}>
              <SearchIcon size={15} color="var(--color-charcoal-soft)" />
              <input
                style={styles.browseSearchInput}
                placeholder="Search schemes..."
                value={schemeSearch}
                onChange={(e) => setSchemeSearch(e.target.value)}
              />
            </div>
            <div style={styles.browseList}>
              {filteredSchemes.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-charcoal-soft)', padding: '12px 0' }}>
                  {schemes.length === 0 ? 'Scheme list is still loading or unavailable.' : 'No schemes match your search.'}
                </p>
              ) : (
                filteredSchemes.map((s) => (
                  <button key={s.id} className="ym-scheme-row" style={styles.browseRow} onClick={() => openSchemeDetail(s)}>
                    <span style={styles.schemeRowDot} />
                    <span>
                      <span style={styles.schemeRowName}>{s.scheme_name}</span>
                      <span style={styles.schemeRowCategory}>{s.category} · {s.level}</span>
                      {s.benefits && <span style={styles.browseRowBenefit}>{s.benefits}</span>}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showSavedSchemes && (
        <div style={styles.overlay} onClick={() => setShowSavedSchemes(false)}>
          <div style={styles.browseModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>Saved Schemes</h2>
              <button style={styles.browseCloseBtn} onClick={() => setShowSavedSchemes(false)}>
                <CloseIcon size={17} />
              </button>
            </div>
            <div style={styles.browseList}>
              {savedSchemesList.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-charcoal-soft)', padding: '12px 0' }}>
                  Nothing saved yet — open any scheme and tap "Save" to keep it here for later, even offline.
                </p>
              ) : (
                savedSchemesList.map((s) => (
                  <button key={s.id} className="ym-scheme-row" style={styles.browseRow} onClick={() => openSchemeDetail(s)}>
                    <span style={styles.schemeRowDot} />
                    <span>
                      <span style={styles.schemeRowName}>{s.scheme_name}</span>
                      <span style={styles.schemeRowCategory}>{s.category} · {s.level}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {viewingScheme && (
        <div style={styles.overlay} onClick={() => setViewingScheme(null)}>
          <div style={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>{viewingScheme.scheme_name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  style={styles.saveIconBtn}
                  onClick={() => handleToggleSaved(viewingScheme)}
                  title={savedSchemeIds.includes(viewingScheme.id) ? 'Remove from saved' : 'Save for later'}
                >
                  <BookmarkIcon size={18} color="var(--color-forest)" filled={savedSchemeIds.includes(viewingScheme.id)} />
                </button>
                <button style={styles.browseCloseBtn} onClick={() => setViewingScheme(null)}>
                  <CloseIcon size={17} />
                </button>
              </div>
            </div>
            <div style={styles.detailBody}>
              {!isOnline && (
                <div style={styles.detailOfflineNote}>
                  Showing details saved on your device. Reconnect to ask Yojana Mitra follow-up questions in chat.
                </div>
              )}
              <div style={styles.detailMeta}>
                {viewingScheme.category} · {viewingScheme.level}
                {viewingScheme.scheme_name_hindi ? ` · ${viewingScheme.scheme_name_hindi}` : ''}
              </div>

              {viewingScheme.description && (
                <p style={styles.detailParagraph}>{viewingScheme.description}</p>
              )}

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Benefits</div>
                <FormattedField value={viewingScheme.benefits} />
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Who's eligible</div>
                <FormattedField value={viewingScheme.eligibility_criteria} />
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Documents needed</div>
                <FormattedField value={viewingScheme.documents_required} />
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>How to apply</div>
                <FormattedField value={viewingScheme.how_to_apply} />
              </div>
            </div>
            {isOnline && (
              <button className="ym-cta" style={styles.detailAskBtn} onClick={() => handleAskAboutScheme(viewingScheme)}>
                Ask Yojana Mitra about this in chat
              </button>
            )}
          </div>
        </div>
      )}

      {toast && <div className="ym-toast">{toast}</div>}
    </div>
  )
}

const styles = {
  sidebarLeft: {
    background: 'var(--color-forest)',
    color: 'var(--color-cream)',
    padding: '18px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    overflowY: 'auto',
  },
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    marginBottom: '14px',
    position: 'relative',
  },
  sidebarBrandTitle: { fontSize: '15px', fontWeight: 700, lineHeight: 1.2 },
  sidebarBrandSub: { fontSize: '10.5px', opacity: 0.75 },
  mobileCloseBtn: {
    display: 'none', marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer',
  },
  sidebarSectionLabel: {
    fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.55,
    margin: '16px 12px 4px',
  },
  sidebarHelp: {
    marginTop: 'auto', background: 'rgba(250,247,240,0.08)', borderRadius: '12px',
    padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px',
  },
  sidebarHelpAvatar: { width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(250,247,240,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' },
  sidebarHelpTitle: { fontSize: '13px', fontWeight: 700 },
  sidebarHelpText: { fontSize: '11.5px', opacity: 0.8, lineHeight: 1.4, marginBottom: '6px' },
  sidebarVoiceBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '999px',
    padding: '7px 14px', background: 'var(--color-forest-light)', color: 'var(--color-cream)',
    fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  mainCol: { display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', background: 'var(--color-cream)' },
  mobileMenuBtn: {
    display: 'none', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', marginRight: '2px',
  },
  statusDot: { display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', marginRight: '5px' },
  header: {
    background: 'var(--color-forest)',
    color: 'var(--color-cream)',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    flexWrap: 'wrap',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  title: { margin: 0, fontSize: '17px', fontFamily: 'var(--font-body)', fontWeight: 700 },
  subtitle: { margin: '2px 0 0', fontSize: '11.5px', opacity: 0.85, display: 'flex', alignItems: 'center' },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  sidebarRight: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', borderLeft: '1px solid rgba(20,83,45,0.1)' },
  rightCard: { background: '#ffffff', borderRadius: '14px', padding: '12px', border: '1px solid rgba(20,83,45,0.1)' },
  rightCardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 700,
    color: 'var(--color-forest)', marginBottom: '6px', padding: '2px 6px',
  },
  viewAllBtn: { background: 'transparent', border: 'none', color: 'var(--color-marigold-dark)', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  schemeRowDot: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-marigold)', marginTop: '6px', flexShrink: 0 },
  schemeRowName: { display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--color-charcoal)', lineHeight: 1.35 },
  schemeRowCategory: { display: 'block', fontSize: '11px', color: 'var(--color-charcoal-soft)', textTransform: 'capitalize', marginTop: '1px' },
  promoCard: {
    background: 'linear-gradient(135deg, var(--color-forest) 0%, var(--color-forest-light) 100%)',
    color: 'var(--color-cream)', borderRadius: '14px', padding: '16px',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(20,83,45,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 70,
  },
  browseModal: {
    background: 'var(--color-cream)', borderRadius: '16px', padding: '18px', maxWidth: '480px', width: '100%',
    maxHeight: '82vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)',
  },
  browseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  browseTitle: { margin: 0, fontSize: '18px', color: 'var(--color-forest)', fontWeight: 700 },
  browseCloseBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-charcoal-soft)' },
  saveIconBtn: {
    background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', padding: '4px',
  },
  detailModal: {
    background: 'var(--color-cream)', borderRadius: '16px', padding: '18px', maxWidth: '520px', width: '100%',
    maxHeight: '86vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)',
  },
  detailBody: { overflowY: 'auto', paddingRight: '4px' },
  detailOfflineNote: {
    background: '#f5e6c8', color: '#6b4d0f', fontSize: '12.5px', padding: '9px 12px',
    borderRadius: '10px', marginBottom: '12px', lineHeight: 1.45,
  },
  detailMeta: { fontSize: '12.5px', color: 'var(--color-charcoal-soft)', textTransform: 'capitalize', marginBottom: '8px' },
  detailParagraph: { fontSize: '13.5px', lineHeight: 1.55, margin: '0 0 14px' },
  detailSection: { marginBottom: '14px', fontSize: '13.5px', lineHeight: 1.5 },
  detailSectionTitle: { fontSize: '12.5px', fontWeight: 700, color: 'var(--color-forest)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '3px' },
  detailAskBtn: {
    marginTop: '10px', width: '100%', textAlign: 'center', padding: '12px', borderRadius: '12px',
    border: 'none', background: 'var(--color-forest)', color: 'var(--color-cream)', fontSize: '14px',
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  browseSearchRow: {
    display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid rgba(20,83,45,0.2)',
    borderRadius: '10px', padding: '9px 12px', marginBottom: '10px',
  },
  browseSearchInput: { border: 'none', outline: 'none', flex: 1, fontSize: '13.5px', fontFamily: 'inherit', background: 'transparent' },
  browseList: { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' },
  browseRow: { alignItems: 'flex-start', background: '#fff', marginBottom: '4px', border: '1px solid rgba(20,83,45,0.08)' },
  browseRowBenefit: { display: 'block', fontSize: '11.5px', color: 'var(--color-charcoal-soft)', marginTop: '3px', lineHeight: 1.4 },
  linksBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '10px 18px',
    background: 'var(--color-sage)',
    borderBottom: '1px solid rgba(20,83,45,0.1)',
  },
  offlineBanner: {
    background: '#f5e6c8',
    color: '#6b4d0f',
    fontSize: '13px',
    padding: '10px 18px',
    lineHeight: 1.5,
    borderBottom: '1px solid rgba(107,77,15,0.15)',
  },
  offlineSchemeList: {
    marginTop: '8px',
    border: '1px solid rgba(20,83,45,0.15)',
    borderRadius: '12px',
    padding: '12px 14px',
    background: '#ffffff',
  },
  offlineListTitle: {
    margin: '0 0 8px',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--color-forest)',
  },
  offlineSchemeItem: {
    display: 'block',
    width: '100%',
    padding: '8px 0',
    borderTop: '1px solid rgba(20,83,45,0.08)',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    background: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '13.5px',
    lineHeight: 1.45,
    color: 'inherit',
  },
  offlineSchemeCategory: {
    fontSize: '11.5px',
    color: 'var(--color-charcoal-soft)',
    textTransform: 'capitalize',
    margin: '2px 0 4px',
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  bubble: {
    padding: '13px 15px',
    borderRadius: '16px',
    maxWidth: '85%',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.5,
    fontSize: '15px',
  },
  userBubble: {
    background: 'var(--color-forest)',
    color: 'var(--color-cream)',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
  },
  assistantBubble: {
    background: '#ffffff',
    color: 'var(--color-charcoal)',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
    boxShadow: '0 1px 4px rgba(20,83,45,0.08)',
    border: '1px solid rgba(20,83,45,0.06)',
  },
  systemNote: {
    fontSize: '13px',
    color: 'var(--color-charcoal-soft)',
    textAlign: 'center',
    padding: '6px',
  },
  errorNote: {
    fontSize: '13px',
    color: '#b00020',
    textAlign: 'center',
    padding: '6px',
  },
  inputArea: {
    display: 'flex',
    gap: '8px',
    padding: '12px',
    borderTop: '1px solid rgba(20,83,45,0.12)',
    background: '#ffffff',
  },
  textInput: {
    flex: 1,
    resize: 'none',
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid rgba(20,83,45,0.2)',
    fontSize: '15px',
    fontFamily: 'inherit',
    background: 'var(--color-cream)',
  },
  sendButton: {
    padding: '0 20px',
    borderRadius: '12px',
    border: 'none',
    background: 'var(--color-forest)',
    color: 'var(--color-cream)',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
}
