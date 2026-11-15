import { useState } from 'react'
import type { Product } from '../lib/supabase'
import { CURRENCY, waLink } from '../config'

export default function BuyBox({ product }: { product: Product }) {
  const [q, setQ] = useState(1)
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const out = product.stock <= 0
  return <div className="buy">
    {product.sizes.length > 0 && <label className="choice">Taille<select value={size} onChange={e => setSize(e.target.value)}><option value="">Choisir une taille</option>{product.sizes.map(v => <option key={v}>{v}</option>)}</select></label>}
    {product.colors.length > 0 && <label className="choice">Couleur<select value={color} onChange={e => setColor(e.target.value)}><option value="">Choisir une couleur</option>{product.colors.map(v => <option key={v}>{v}</option>)}</select></label>}
    <div className="qty"><div><small style={{ color: 'var(--mute)', display: 'block' }}>Quantité · Stock : {product.stock}</small><div className="stp"><button type="button" aria-label="Moins" disabled={out} onClick={() => setQ(Math.max(1, q - 1))}>−</button><span aria-live="polite">{q}</span><button type="button" aria-label="Plus" disabled={out} onClick={() => setQ(Math.min(Math.max(1, product.stock), q + 1))}>+</button></div></div><div className="tot">Total : <b>{Number(product.price) * q} {CURRENCY}</b></div></div>
    {out ? <div className="soldout">Rupture de stock</div> : <a className="wa" href={waLink(product, Math.min(q, product.stock), size, color)} target="_blank" rel="noopener noreferrer">Commander sur WhatsApp</a>}
  </div>
}
