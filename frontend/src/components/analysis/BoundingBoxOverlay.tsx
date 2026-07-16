import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Detection } from '@/lib/analyses'

type Props = {
  src: string
  detections: Detection[]
  imageWidth: number
  imageHeight: number
}

const LABEL_COLORS = [
  'border-cyan-400 text-cyan-300 bg-cyan-950/70',
  'border-orange-400 text-orange-300 bg-orange-950/70',
  'border-emerald-400 text-emerald-300 bg-emerald-950/70',
  'border-rose-400 text-rose-300 bg-rose-950/70',
  'border-violet-400 text-violet-300 bg-violet-950/70',
]

export function BoundingBoxOverlay({ src, detections, imageWidth, imageHeight }: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number } | null>(null)

  const handleLoad = () => {
    if (imgRef.current) {
      setDisplaySize({
        w: imgRef.current.clientWidth,
        h: imgRef.current.clientHeight,
      })
    }
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950">
      <img
        ref={imgRef}
        src={src}
        alt="Incident evidence"
        className="w-full object-contain"
        onLoad={handleLoad}
      />

      {displaySize &&
        detections.map((det, i) => {
          const scaleX = displaySize.w / imageWidth
          const scaleY = displaySize.h / imageHeight
          const [x1, y1, x2, y2] = det.bbox
          const color = LABEL_COLORS[i % LABEL_COLORS.length]

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.12 + 0.3 }}
              className={`absolute border-2 ${color}`}
              style={{
                left: x1 * scaleX,
                top: y1 * scaleY,
                width: (x2 - x1) * scaleX,
                height: (y2 - y1) * scaleY,
              }}
            >
              <span
                className={`absolute -top-6 left-0 border px-1.5 py-0.5 text-xs font-semibold ${color}`}
              >
                {det.label} {Math.round(det.confidence * 100)}%
              </span>
            </motion.div>
          )
        })}
    </div>
  )
}
