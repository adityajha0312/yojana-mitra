import { useState, useEffect, useRef } from 'react'
import { fetchAllSchemes } from './lib/supabase'
import { askGemini } from './lib/gemini'
import Logo from './Logo'
import LandingPage from './LandingPage'

const QUICK_LINKS = [
  { label: 'PM-KISAN', url: 'https://pmkisan.gov.in' },
  { label: 'Ayushman Bharat', url: 'https://pmjay.gov.in' },
  { label: 'MP Scholarship Portal', url: 'https://scholarshipportal.mp.nic.in' },
  { label: 'MP Social Security', url: 'https://socialsecurity.mp.gov.in' },
  { label: 'PM Awas Yojana', url: 'https://pmayg.nic.in' },
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

  return `You are Yojana Mitra, a friendly AI assistant that helps Indian citizens (especially in Madhya Pradesh) discover government welfare schemes they may be eligible for.

Here is the full list of schemes you know about:
${schemeList}

RULES:
- Ask the user simple, friendly questions about themselves (occupation, age, gender, income situation, land ownership, etc.) if you don't have enough information yet to match them to schemes.
- Once you have enough information, recommend the schemes they likely qualify for, explain briefly WHY they qualify, list the documents needed, and explain how to apply.
- Only greet with "Namaste" in your very first reply of the conversation. In every reply after that, get straight to the point — no repeated welcomes or greetings.
- Be warm and conversational, not robotic. Keep responses concise and easy to read on a phone screen.
- Use **bold** only around scheme names and key numbers (amounts, deadlines) — not whole sentences.
- If the user writes in Hindi or Hinglish, respond in the same style/language they used.
- Never invent a scheme that isn't in the list above.
- If nothing matches, say so honestly and suggest they check the National Scholarship Portal or nearest Common Service Centre (CSC) for more options.`
}

function Welcome() {
  return {
    role: 'assistant',
    text: "Namaste! I'm Yojana Mitra. Tell me a bit about yourself — your occupation, age, or situation — and I'll help you find government schemes you may be eligible for.",
  }
}

export default function App() {
  const [started, setStarted] = useState(false)
  const [schemes, setSchemes] = useState([])
  const [messages, setMessages] = useState([Welcome()])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSchemes, setLoadingSchemes] = useState(true)
  const [error, setError] = useState(null)
  const [showLinks, setShowLinks] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchAllSchemes().then((data) => {
      setSchemes(data)
      setLoadingSchemes(false)
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', text: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const systemInstruction = buildSystemInstruction(schemes)
      const replyText = await askGemini(systemInstruction, newMessages)
      setMessages([...newMessages, { role: 'assistant', text: replyText }])
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
  }

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
          <button className="ym-icon-btn" onClick={() => setShowLinks((s) => !s)}>
            Official Sites
          </button>
          <button className="ym-icon-btn" onClick={handleClearChat}>
            Clear Chat
          </button>
        </div>
      </header>

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
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputArea}>
        <textarea
          style={styles.textInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (e.g. 'I am a farmer with 2 acres of land')"
          rows={2}
          disabled={loadingSchemes}
        />
        <button
          className="ym-send-btn"
          style={styles.sendButton}
          onClick={handleSend}
          disabled={loading || loadingSchemes || !input.trim()}
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
    height: '100vh',
    maxWidth: '640px',
    margin: '0 auto',
    fontFamily: 'var(--font-body)',
    background: 'var(--color-cream)',
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
  title: { margin: 0, fontSize: '19px', fontFamily: 'var(--font-display)', fontWeight: 600 },
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
