import { createClient } from '@supabase/supabase-js'
import { saveSchemesToCache, getSchemesFromCache } from './offline'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Fetches all schemes from the database. If the network request fails
// (e.g. no internet), falls back to the last successfully cached copy
// stored in localStorage, so the app can still show scheme info offline.
export async function fetchAllSchemes() {
  try {
    const { data, error } = await supabase.from('schemes').select('*')
    if (error) throw error
    if (data && data.length > 0) {
      saveSchemesToCache(data)
    }
    return { schemes: data || [], fromCache: false }
  } catch (e) {
    console.warn('Could not fetch schemes from network, trying cache:', e)
    const cached = getSchemesFromCache()
    if (cached) {
      return { schemes: cached, fromCache: true }
    }
    return { schemes: [], fromCache: false }
  }
}
