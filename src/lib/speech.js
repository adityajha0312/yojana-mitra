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

let voicesReadyPromise = null

// On first use, voice list may not be loaded yet in some browsers, which
// can cause the very first speak() call to fail silently. This waits for
// voices to be ready (or times out after 1s) before we speak.
function waitForVoices() {
  if (!isVoiceOutputSupported) return Promise.resolve()
  if (voicesReadyPromise) return voicesReadyPromise

  voicesReadyPromise = new Promise((resolve) => {
    if (window.speechSynthesis.getVoices().length > 0) {
      resolve()
      return
    }
    const timeout = setTimeout(resolve, 1000)
    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timeout)
      resolve()
    }
  })
  return voicesReadyPromise
}

// Splits text into sentence-sized chunks. Chrome has a well-known bug where
// a single long utterance (roughly 15+ seconds of speech) can silently stop
// partway through. Speaking shorter sentences as a queue of separate
// utterances - rather than one long one - avoids that bug entirely, and is
// more reliable than trying to keep one long utterance alive with pause/resume
// tricks.
function splitIntoSentences(text) {
  const cleaned = cleanTextForSpeech(text)
  const sentences = cleaned.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g)
  return (sentences || [cleaned]).map((s) => s.trim()).filter(Boolean)
}

let speechQueue = []
let isSpeakingQueue = false

function speakNextInQueue(lang) {
  if (speechQueue.length === 0) {
    isSpeakingQueue = false
    return
  }
  isSpeakingQueue = true
  const sentence = speechQueue.shift()
  const utterance = new SpeechSynthesisUtterance(sentence)
  utterance.lang = lang
  utterance.rate = 0.95
  utterance.onend = () => speakNextInQueue(lang)
  utterance.onerror = () => speakNextInQueue(lang)
  window.speechSynthesis.speak(utterance)
}

export function speakText(text, lang = 'en-IN') {
  if (!isVoiceOutputSupported) return
  window.speechSynthesis.cancel()
  speechQueue = []
  isSpeakingQueue = false

  waitForVoices().then(() => {
    setTimeout(() => {
      speechQueue = splitIntoSentences(text)
      speakNextInQueue(lang)
    }, 120)
  })
}

export function stopSpeaking() {
  if (isVoiceOutputSupported) {
    speechQueue = []
    isSpeakingQueue = false
    window.speechSynthesis.cancel()
  }
}
