import { useRef, useState } from 'react'

export default function Carousel({ images, alt }: { images: string[]; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(0)
  const go = (d: number) =>
    ref.current?.scrollBy({ left: d * ref.current.clientWidth, behavior: 'smooth' })

  return (
    <div>
      <div className="car">
        <div
          className="sl" ref={ref} tabIndex={0} aria-label={`Photos de ${alt}`}
          onScroll={e => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        >
          {images.map((src, k) => <img key={k} src={src} alt={alt} />)}
        </div>
        {images.length > 1 && (
          <>
            <button className="ar l" aria-label="Photo précédente" onClick={() => go(-1)}>‹</button>
            <button className="ar r" aria-label="Photo suivante" onClick={() => go(1)}>›</button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="dots">{images.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
      )}
    </div>
  )
}
