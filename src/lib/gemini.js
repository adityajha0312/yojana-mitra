const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// Using Flash-Lite for speed - a clearer, more direct prompt (rather than
// a slower/more expensive model) is what actually fixed the scheme-matching
// reliability, so there's no need to trade away speed for it.
const MODEL = 'gemini-3.5-flash-lite'
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
export async function askGemini(systemInstruction, conversationHistory, jsonMode = false) {
  const body = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: conversationHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    })),
  }
  if (jsonMode) {
    body.generationConfig = { responseMimeType: 'application/json', temperature: 0.2 }
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

// Extracts fields from photos of documents (Aadhaar, land records, etc.)
// using Gemini's native image understanding - no separate OCR library
// needed. Used to pre-fill a scheme application review form.
export async function extractDocumentFields(images, schemeName, requiredDocs) {
  const docsText = Array.isArray(requiredDocs) ? requiredDocs.join(', ') : requiredDocs

  const promptText = `You are extracting information from photos of Indian government documents, to help pre-fill an application for the scheme "${schemeName}". The documents typically needed for this scheme are: ${docsText}.

Look carefully at the attached image(s) and extract any of these fields you can actually read: Full Name, Date of Birth, Gender, Aadhaar Number, Address, Father's or Husband's Name, Bank Account Number, IFSC Code, Bank Name, Land/Khasra/Khatauni Number, Village, District, State, Annual Income (if shown on a document), Category (SC/ST/OBC/General, if shown), Mobile Number.

Respond with ONLY a raw JSON object (no markdown, no code fences), exactly this shape:
{
  "extracted": { "Full Name": "value or null", "Date of Birth": "value or null", ... (include every field listed above as a key) },
  "notes": "brief note on image quality or anything unclear, or null if nothing to flag"
}

CRITICAL: If a field is not clearly visible or not present in the image(s), use null for it - never guess, infer, or invent a value that isn't actually shown in the document.`

  const parts = [{ text: promptText }]
  for (const img of images) {
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } })
  }

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Document extraction failed (${response.status}): ${errText}`)
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No response from document extraction')

  try {
    return JSON.parse(text)
  } catch (e) {
    throw new Error('Could not read the extracted details - please try again with a clearer photo.')
  }
}
