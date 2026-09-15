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

// Lightweight keyword matching to guess which scheme categories are
// relevant based on the conversation so far. This isn't meant to be
// exact - it just narrows Gemini's attention to a smaller, clearly-labeled
// "likely relevant" subset instead of leaving it to search all schemes
// from scratch, which in testing made it too quick to give up entirely.
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
  const matched = new Set(['general']) // general schemes are broadly relevant, always include
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

  const formatForMatching = (s) => `{"id": "${s.id}", "name": "${s.scheme_name}", "category": "${s.category}", "eligibility": ${JSON.stringify(s.eligibility_criteria)}}`

  return `You are a matching engine for Yojana Mitra, a government scheme assistant. Your ONLY job is to decide which scheme IDs from the list below match the person's situation. You do not write scheme names, amounts, or facts yourself - you only select IDs and give a one-line reason for each.

LIKELY RELEVANT (check these first, based on the conversation so far):
${likelyRelevant.map(formatForMatching).join('\n')}

OTHER SCHEMES (less likely, but check if situation shifts):
${others.map(formatForMatching).join('\n')}

Respond with ONLY a raw JSON object (no markdown, no code fences), exactly this shape:
{
  "needs_more_info": boolean,
  "clarifying_question": "short friendly question, or null if needs_more_info is false",
  "matched_scheme_ids": ["id_from_list_above", ...],
  "reasoning": { "id_from_list_above": "one short sentence on why they qualify, in the person's language" }
}

RULES:
- "matched_scheme_ids" must ONLY contain ids exactly as given in the lists above (e.g. "pm_kisan", "mp_widow_pension"). Never invent an id or name that isn't in the lists.
- If you don't have enough details to check eligibility confidently, set needs_more_info to true and ask 1-2 short questions - do not guess.
- Be confident and thorough once you have enough info: include EVERY scheme whose eligibility criteria the person's details satisfy, not just the first one you find. A person often qualifies for multiple schemes at once (e.g. a widow who is also a senior citizen qualifies for both widow pension AND old age pension - check both).
- Treat plain statements about their situation as sufficient evidence, don't demand paperwork-level proof before matching: "no income" or "husband passed away and no income" satisfies a BPL/low-income/economically-weaker eligibility criterion - you do not need them to say the words "BPL card" first. Similarly, "husband passed away" clearly means widowed. Match on the substance of what they said, not on whether they used the exact bureaucratic term.
- A scheme requiring a document or card the person doesn't have yet (like a BPL card) is still a MATCH, not a blocker - getting that document is normally part of the application process itself, not a precondition for recommending the scheme. Only withhold a match for a genuine eligibility criterion (age range, gender, income threshold, land size, category) that the stated facts actually fail or that you still don't know.
- Only return an empty matched_scheme_ids array (with needs_more_info false) if you've genuinely checked and nothing fits - never as a default.
- Match the person's language for the clarifying_question and reasoning text (English/Hindi/Hinglish).
- Do not include any text outside the JSON object.`
}

// Renders the final chat message from OUR verified scheme data, using only
// Gemini's chosen scheme IDs and short reasoning - never Gemini's own
// description of scheme facts. This makes it structurally impossible for
// the AI to state a wrong amount, wrong document, or invented scheme name,
// since all of that text comes directly from our database, not from the model.
function renderMatchResult(parsed, allSchemes) {
  if (parsed.needs_more_info) {
    return parsed.clarifying_question || 'Could you share a few more details about your situation?'
  }

  const validIds = new Set(allSchemes.map((s) => s.id))
  const matchedSchemes = (parsed.matched_scheme_ids || [])
    .filter((id) => validIds.has(id))
    .map((id) => allSchemes.find((s) => s.id === id))

  if (matchedSchemes.length === 0) {
    return "I don't have a verified scheme for your exact situation in my current database. I'd suggest checking the National Scholarship Portal, your nearest Common Service Centre (CSC), or the relevant district office for more options."
  }

  const parts = matchedSchemes.map((s, i) => {
    const reason = parsed.reasoning?.[s.id] || ''
    const docs = Array.isArray(s.documents_required) ? s.documents_required.join(', ') : s.documents_required
    return `${i + 1}. **${s.scheme_name}**${reason ? ` — ${reason}` : ''}
* Benefit: ${s.benefits}
* Documents needed: ${docs}
* How to apply: ${s.how_to_apply}`
  })

  const intro = matchedSchemes.length > 1
    ? 'Based on your details, here are the schemes you may qualify for:'
    : 'Based on your details, here is a scheme you may qualify for:'

  return `${intro}\n\n${parts.join('\n\n')}`
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
      const conversationText = newMessages.map((m) => m.text).join(' ')
      const systemInstruction = buildSystemInstruction(schemes, conversationText)
      const rawResponse = await askGemini(systemInstruction, newMessages, true)

      let parsed
      try {
        parsed = JSON.parse(rawResponse)
      } catch (parseErr) {
        // If Gemini didn't return clean JSON for some reason, fail safe by
        // asking the person to rephrase rather than showing broken output.
        parsed = {
          needs_more_info: true,
          clarifying_question: "Sorry, could you tell me a bit more about your situation (occupation, age, or income)?",
        }
      }

      const replyText = renderMatchResult(parsed, schemes)
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
