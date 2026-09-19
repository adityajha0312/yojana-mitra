const SETTINGS_KEY = 'yojana_mitra_settings'

export const DEFAULT_SETTINGS = {
  textSize: 'normal', // 'normal' | 'large'
  defaultVoiceLang: 'en-IN',
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch (e) {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.warn('Could not save settings locally:', e)
  }
}
