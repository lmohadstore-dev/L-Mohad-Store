import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured = Boolean(url && anonKey && url.startsWith('https://'))
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
)

export type Category = { id: string; name: string; created_at?: string }
export type Product = {
  id: string
  name: string
  price: number
  description: string
  images: string[]
  category_id: string | null
  stock: number
  sizes: string[]
  colors: string[]
  created_at?: string
}
export const withImages = (rows: unknown): Product[] =>
  ((rows ?? []) as Partial<Product>[]).map(p => ({
    ...p,
    id: p.id!, name: p.name ?? '', price: Number(p.price ?? 0),
    description: p.description ?? '', images: p.images ?? [],
    category_id: p.category_id ?? null, stock: Number(p.stock ?? 0),
    sizes: p.sizes ?? [], colors: p.colors ?? [],
  }))

export async function isStoreAdmin(userId: string) {
  const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export function subscribeToStore(onChange: () => void) {
  const channel = supabase.channel(`store-updates-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, onChange)
    .subscribe()
  return () => { void supabase.removeChannel(channel) }
}
