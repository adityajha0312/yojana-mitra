// Local-only profile - there's no login/auth in this app, so this just
// remembers a few basics on this device (localStorage) so returning users
// don't have to retype their situation every time they open the chat.

const PROFILE_KEY = 'yojana_mitra_profile'

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch (e) {
    console.warn('Could not save profile locally:', e)
  }
}

export function clearProfile() {
  try {
    localStorage.removeItem(PROFILE_KEY)
  } catch (e) {
    // ignore
  }
}

// Turns a saved profile into a natural first message for the chatbot,
// so "Use my profile in chat" skips straight past the intro questions.
export function profileToOpener(profile) {
  if (!profile) return null
  const parts = []
  if (profile.occupation) parts.push(`I'm a ${profile.occupation.toLowerCase()}`)
  if (profile.age) parts.push(`I'm ${profile.age} years old`)
  if (profile.location) parts.push(`I live in ${profile.location}`)
  if (parts.length === 0) return null
  return parts.join(', ') + '. What schemes might I be eligible for?'
}
