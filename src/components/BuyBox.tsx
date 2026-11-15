
import { useState } from 'react'
import type { Product } from '../lib/supabase'
import { CURRENCY, waLink } from '../config'

export default function BuyBox({ product }: { product: Product }) {
  const [q, setQ] = useState(1)
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')

  return (
    <div className="buy">

      {product.sizes.length > 0 && (
        <label className="choice">
          Taille
          <select
            value={size}
            onChange={e => setSize(e.target.value)}
          >
            <option value="">Choisir une taille</option>
            {product.sizes.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
      )}

      {product.colors.length > 0 && (
        <label className="choice">
          Couleur
          <select
            value={color}
            onChange={e => setColor(e.target.value)}
          >
            <option value="">Choisir une couleur</option>
            {product.colors.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
      )}

      <div className="qty">
        <div>
          <div className="stp">
            <button
              type="button"
              aria-label="Moins"
              onClick={() => setQ(Math.max(1, q - 1))}
            >
              −
            </button>

            <span aria-live="polite">{q}</span>

            <button
              type="button"
              aria-label="Plus"
              onClick={() => setQ(q + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="tot">
          Total : <b>{Number(product.price) * q} {CURRENCY}</b>
        </div>
      </div>

      <a
        className="wa"
        style={{
          display: 'block',
          backgroundColor: '#168A46',
          color: '#FFFFFF'
        }}
        href={waLink(product, q, size, color)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Commander sur WhatsApp
      </a>

    </div>
  )
}
