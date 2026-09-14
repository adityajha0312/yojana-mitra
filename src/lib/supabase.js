import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Fetches all schemes from the database once. Since there are only ~10-20
// schemes, we pull them all and let Gemini do the matching reasoning,
// rather than writing complex filter logic ourselves.
export async function fetchAllSchemes() {
  const { data, error } = await supabase.from('schemes').select('*')
  if (error) {
    console.error('Error fetching schemes:', error)
    return []
  }
  return data
}
