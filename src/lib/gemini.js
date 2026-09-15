const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// Using the full Flash model (not Lite) here deliberately: this app's core
// trust requirement is that it NEVER recommends a scheme outside our
// verified database, and Flash follows strict constraints more reliably
// than Flash-Lite. Free-tier rate limits are lower, but accuracy matters
// more than speed for a government-scheme matching tool.
const MODEL = 'gemini-3.5-flash'
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
// Google's newer "Auth key" format (starts with AQ.) must be sent as the
// x-goog-api-key header rather than a ?key= URL parameter, unlike the old
// AIzaSy-format keys. This works for both formats.

// Waits `ms` milliseconds before continuing.
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Calls the Gemini API with automatic retry if we hit a rate limit (HTTP 429).
// Retries up to 3 times with increasing wait times (1s, 2s, 4s) before giving up.
export async function askGemini(systemInstruction, conversationHistory) {
  const body = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: conversationHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    })),
  }

  let lastError = null

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify(body),
      })

      if (response.status === 429) {
        // Rate limited - wait and retry with exponential backoff
        lastError = 'Rate limited'
        await wait(1000 * Math.pow(2, attempt))
        continue
      }

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Gemini API error (${response.status}): ${errText}`)
      }

      const data = await response.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) {
        throw new Error('No response text from Gemini')
      }
      return text
    } catch (err) {
      lastError = err.message
      if (attempt === 3) {
        throw new Error(
          `Could not get a response after several tries. Last error: ${lastError}`
        )
      }
      await wait(1000 * Math.pow(2, attempt))
    }
  }

  throw new Error(lastError || 'Unknown error calling Gemini')
}
