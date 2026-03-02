import { useEffect, useRef } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'

interface RouteAnimationProps {
  map: MapboxMap
  layerId: string
  onComplete?: () => void
}

const DURATION_MS = 1800

export function RouteAnimation({ map, layerId, onComplete }: RouteAnimationProps) {
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const startTime = performance.now()

    function frame(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / DURATION_MS, 1)

      map.setPaintProperty(layerId, 'line-dasharray', [Math.max(0, progress * 2), Math.max(0, (1 - progress) * 2)])

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        onComplete?.()
      }
    }

    rafRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [map, layerId, onComplete])

  return null
}
