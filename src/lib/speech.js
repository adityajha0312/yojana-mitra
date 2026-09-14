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

let keepAliveTimer = null

function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer)
    keepAliveTimer = null
  }
}

// Chrome has a long-standing bug where speechSynthesis stops speaking
// partway through longer text (roughly 15+ seconds in). Periodically
// pausing/resuming keeps it alive for the full utterance.
function startKeepAlive() {
  stopKeepAlive()
  keepAliveTimer = setInterval(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
      window.speechSynthesis.resume()
    } else {
      stopKeepAlive()
    }
  }, 9000)
}

// Chrome also sometimes silently drops a speak() call if it's fired
// immediately after cancel() - a short delay avoids the race condition.
export function speakText(text, lang = 'en-IN') {
  if (!isVoiceOutputSupported) return
  window.speechSynthesis.cancel()
  stopKeepAlive()

  waitForVoices().then(() => {
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(text))
      utterance.lang = lang
      utterance.rate = 0.95

      utterance.onstart = () => startKeepAlive()
      utterance.onend = () => stopKeepAlive()
      utterance.onerror = () => stopKeepAlive()

      window.speechSynthesis.speak(utterance)
    }, 120)
  })
}

export function stopSpeaking() {
  if (isVoiceOutputSupported) {
    stopKeepAlive()
    window.speechSynthesis.cancel()
  }
}
