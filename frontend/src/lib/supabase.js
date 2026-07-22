import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export function isSupabaseConfigured() {
  return Boolean(supabase)
}

export async function uploadVendorAsset(file, folder = 'kyc') {
  if (!supabase) throw new Error('Supabase is not configured')
  const ext = file.name.split('.').pop() || 'bin'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('vendor-uploads').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from('vendor-uploads').getPublicUrl(path)
  return data.publicUrl
}
