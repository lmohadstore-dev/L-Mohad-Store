import type { Product } from './lib/supabase'

export const STORE_NAME = 'L’Mohad Store'
export const WHATSAPP = '212667153776' // +212 667153776
export const CURRENCY = 'MAD'

export function waText(p: Product, qty: number, size = '', color = '') {
  return (
    'السلام عليكم، أرغب في طلب المنتج التالي:\n\n' +
    `${p.name}\n${Number(p.price)} درهم\nالكمية: ${qty}\n` +
    (size ? `المقاس: ${size}\n` : '') +
    (color ? `اللون: ${color}\n` : '') + '\n' +
    `رابط المنتج: ${window.location.origin}/p/${p.id}`
  )
}
export const waLink = (p: Product, qty: number, size = '', color = '') =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(waText(p, qty, size, color))}`
