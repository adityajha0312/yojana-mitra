// Wraps the browser's built-in Web Speech API.
// Voice input (SpeechRecognition) and voice output (SpeechSynthesis) are
// both free and built into Chrome/Edge - no API key needed. Support varies
// by browser (works best in Chrome-based browsers; not supported in Firefox,
// limited in Safari), so we detect availability and fail gracefully.

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

export const isVoiceInputSupported = !!SpeechRecognitionAPI
export const isVoiceOutputSupported =
  typeof window !== 'undefined' && !!window.speechSynthesis

// Starts listening for speech and returns a controller object with a
// stop() method. Callbacks receive the transcript as it's recognized.
export function startListening({ lang = 'en-IN', onResult, onEnd, onError }) {
  if (!SpeechRecognitionAPI) {
    onError?.('Voice input is not supported in this browser. Try Chrome or Edge.')
    return { stop: () => {} }
  }

  const recognition = new SpeechRecognitionAPI()
  recognition.lang = lang
  recognition.interimResults = true
  recognition.continuous = false

  recognition.onresult = (event) => {
    let transcript = ''
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript
    }
    const isFinal = event.results[event.results.length - 1].isFinal
    onResult?.(transcript, isFinal)
  }

  recognition.onerror = (event) => {
    onError?.(event.error)
  }

  recognition.onend = () => {
    onEnd?.()
  }

  recognition.start()
  return { stop: () => recognition.stop() }
}

// Strips markdown symbols (**, *, bullet dashes) so spoken text sounds
// natural instead of reading out "asterisk asterisk".
function cleanTextForSpeech(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/^[*\-]\s+/gm, '')
    .replace(/\n+/g, '. ')
}

export function speakText(text, lang = 'en-IN') {
  if (!isVoiceOutputSupported) return
  window.speechSynthesis.cancel() // stop any current speech first
  const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(text))
  utterance.lang = lang
  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (isVoiceOutputSupported) {
    window.speechSynthesis.cancel()
  }
}
