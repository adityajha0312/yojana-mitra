import { useState, useEffect, useRef } from 'react'
import { fetchAllSchemes } from './lib/supabase'
import { askGemini } from './lib/gemini'

// Builds the instructions we give Gemini every time, including the full
// list of government schemes it should match users against.
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
- Be warm and conversational, not robotic. Keep responses concise and easy to read on a phone screen.
- If the user writes in Hindi or Hinglish, respond in the same style/language they used.
- Never invent a scheme that isn't in the list above.
- If nothing matches, say so honestly and suggest they check the National Scholarship Portal or nearest Common Service Centre (CSC) for more options.`
}

export default function App() {
  const [schemes, setSchemes] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSchemes, setLoadingSchemes] = useState(true)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchAllSchemes().then((data) => {
      setSchemes(data)
      setLoadingSchemes(false)
      setMessages([
        {
          role: 'assistant',
          text: "Namaste! I'm Yojana Mitra 🙏 Tell me a bit about yourself — your occupation, age, or situation — and I'll help you find government schemes you may be eligible for.",
        },
      ])
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🙏 Yojana Mitra</h1>
        <p style={styles.subtitle}>Your Government Scheme Assistant</p>
      </header>

      <div style={styles.chatArea}>
        {loadingSchemes ? (
          <p style={styles.systemNote}>Loading scheme database...</p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.bubble,
                ...(msg.role === 'user' ? styles.userBubble : styles.assistantBubble),
              }}
            >
              {msg.text}
            </div>
          ))
        )}
        {loading && <div style={styles.systemNote}>Yojana Mitra is thinking...</div>}
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
    maxWidth: '600px',
    margin: '0 auto',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    background: '#f7f7fb',
  },
  header: {
    background: '#0f5132',
    color: 'white',
    padding: '16px 20px',
    textAlign: 'center',
  },
  title: { margin: 0, fontSize: '22px' },
  subtitle: { margin: '4px 0 0', fontSize: '13px', opacity: 0.85 },
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  bubble: {
    padding: '12px 14px',
    borderRadius: '14px',
    maxWidth: '85%',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.45,
    fontSize: '15px',
  },
  userBubble: {
    background: '#0f5132',
    color: 'white',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
  },
  assistantBubble: {
    background: 'white',
    color: '#222',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  systemNote: {
    fontSize: '13px',
    color: '#888',
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
    borderTop: '1px solid #ddd',
    background: 'white',
  },
  textInput: {
    flex: 1,
    resize: 'none',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #ccc',
    fontSize: '15px',
    fontFamily: 'inherit',
  },
  sendButton: {
    padding: '0 18px',
    borderRadius: '10px',
    border: 'none',
    background: '#0f5132',
    color: 'white',
    fontSize: '15px',
    cursor: 'pointer',
  },
}
