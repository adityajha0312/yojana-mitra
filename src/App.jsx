import { useState, useEffect, useRef } from 'react'
import { fetchAllSchemes } from './lib/supabase'
import { askGemini } from './lib/gemini'
import { startListening, speakText, stopSpeaking, isVoiceInputSupported, isVoiceOutputSupported } from './lib/speech'
import { subscribeToConnectionStatus, isCurrentlyOnline, getCacheAge, getSchemesFromCache } from './lib/offline'
import Logo from './Logo'
import { MicIcon, StopIcon, SpeakerOnIcon, SpeakerOffIcon } from './Icons'
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

function buildSystemInstruction(schemes) {
  const schemeNames = schemes.map((s) => s.scheme_name).join(', ')
  const schemeList = schemes
    .map(
      (s) => `
Scheme: ${s.scheme_name} (${s.scheme_name_hindi || ''})
Category: ${s.category} | Level: ${s.level}
Description: ${s.description}
Eligibility: ${JSON.stringify(s.eligibility_criteria)}
Benefits: ${s.benefits}
Documents required: ${JSON.stringify(s.documents_required)}
How to apply: ${s.how_to_apply}
`
    )
    .join('\n---\n')

  return `You are Yojana Mitra, an AI assistant with ONE job: match Indian citizens (especially in Madhya Pradesh) to schemes from a FIXED, CLOSED list of ${schemes.length} government schemes. You are not a general knowledge assistant.

=== THE COMPLETE, EXHAUSTIVE LIST OF SCHEMES YOU ARE ALLOWED TO MENTION ===
${schemeNames}
=== END OF ALLOWED LIST ===

Full details for each allowed scheme:
${schemeList}

HARD CONSTRAINT (this is about NEVER INVENTING scheme names - it does NOT mean being hesitant to recommend real matches):
You are FORBIDDEN from naming, describing, or recommending ANY scheme whose exact name is not in the "ALLOWED LIST" above - even if it is a real Indian government scheme you know about from training (e.g. Mission Vatsalya, PM CARES for Children, PMJJBY, PMSBY, Beti Bachao Beti Padhao, or any other scheme not listed above).

But the flip side matters equally: when a person's details clearly satisfy a listed scheme's eligibility criteria, you MUST recommend it confidently and directly - do not hold back, hedge, or default to "I don't have a verified scheme" out of excess caution. Being overly cautious about schemes that ARE in your list is just as wrong as inventing ones that aren't.

Worked example of correct behavior: if a user says they are a farmer with 2 acres of land in Madhya Pradesh, and (after any needed clarifying questions) you learn their landholding is small, you should confidently recommend PM-KISAN (small farmer, cultivable land - clear match), PM Fasal Bima Yojana (owns farmland - clear match), and Soil Health Card Scheme (any landholding size - clear match) by name, with their real details from the list above. This is a normal, common, correct match - not a situation to be hesitant about.

Only reach "I don't have a verified scheme for your exact situation" when you have gathered enough details and genuinely NONE of the ${schemes.length} allowed schemes' eligibility criteria fit - not merely because the situation seems ordinary or you want to be extra safe.

If, after asking clarifying questions and gathering real details, genuinely none of the allowed schemes fit, say so honestly: "I don't have a verified scheme for your exact situation in my current database," then suggest the National Scholarship Portal, nearest Common Service Centre (CSC), or relevant district office. Never soften this by naming an unlisted scheme "just in case" - but equally, never reach this conclusion prematurely when a real match from the list exists.

OTHER RULES:
- Your default first move for any real situation is to ask 1-2 simple, friendly clarifying questions (occupation, age, gender, income, land ownership, family size, etc.) before deciding whether anything matches. Do NOT jump straight to "I don't have a verified scheme" just because the user's first message was brief - a short message like "I am a farmer in Madhya Pradesh" is normal for a first message; respond by asking what you still need to know (e.g. how much land they own) so you can check it against the allowed list properly, exactly as you would for any other category.
- Only say "I don't have a verified scheme for your exact situation" AFTER you've asked and received enough details to genuinely rule out every scheme in the allowed list - never as a first response to a short opening message.
- Once you have enough information, recommend only allowed-list schemes they likely qualify for, explain briefly WHY, list documents needed, and explain how to apply - all pulled from the details given above, never invented.
- Only greet with "Namaste" in your very first reply of the conversation. Every reply after that goes straight to the point.
- Be warm and conversational, not robotic. Keep responses concise and easy to read on a phone screen.
- Use **bold** only around scheme names and key numbers (amounts, deadlines) - not whole sentences.
- If the user writes in Hindi or Hinglish, respond in the same style/language they used.`
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
  const [isListening, setIsListening] = useState(false)
  const [voiceLang, setVoiceLang] = useState('en-IN')
  const [speakEnabled, setSpeakEnabled] = useState(false)
  const listenControllerRef = useRef(null)
  const [isOnline, setIsOnline] = useState(isCurrentlyOnline())
  const [usingCachedSchemes, setUsingCachedSchemes] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchAllSchemes().then(({ schemes, fromCache }) => {
      setSchemes(schemes)
      setUsingCachedSchemes(fromCache)
      setLoadingSchemes(false)
    })
  }, [])

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
      const systemInstruction = buildSystemInstruction(schemes)
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

  if (!started) {
    return <LandingPage onStart={() => setStarted(true)} />
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Logo size={32} />
          <div>
            <h1 style={styles.title}>Yojana Mitra</h1>
            <p style={styles.subtitle}>Your Government Scheme Assistant</p>
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
          <button className="ym-icon-btn" onClick={() => setShowLinks((s) => !s)}>
            Official Sites
          </button>
          <button className="ym-icon-btn" onClick={handleClearChat}>
            Clear Chat
          </button>
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
            <p style={styles.offlineListTitle}>Saved schemes you can browse offline:</p>
            {schemes.map((s) => (
              <div key={s.id} style={styles.offlineSchemeItem}>
                <strong>{s.scheme_name}</strong>
                <div style={styles.offlineSchemeCategory}>{s.category} · {s.level}</div>
                <div>{s.description}</div>
              </div>
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
        >
          Send
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 32px)',
    maxWidth: '640px',
    margin: '16px auto',
    fontFamily: 'var(--font-body)',
    background: 'var(--color-cream)',
    borderRadius: '18px',
    overflow: 'hidden',
    boxShadow: '0 12px 40px rgba(20, 83, 45, 0.14)',
  },
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
    gap: '10px',
  },
  title: { margin: 0, fontSize: '19px', fontFamily: 'var(--font-body)', fontWeight: 700 },
  subtitle: { margin: '2px 0 0', fontSize: '12px', opacity: 0.85 },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
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
    padding: '8px 0',
    borderTop: '1px solid rgba(20,83,45,0.08)',
    fontSize: '13.5px',
    lineHeight: 1.45,
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
