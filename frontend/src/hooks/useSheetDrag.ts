import { useRef, useState } from 'react'

interface UseSheetDragOptions {
  snapPoints: [number, number]
  onDismiss: () => void
}

interface UseSheetDragResult {
  height: number
  snapIndex: 0 | 1
  sheetRef: React.RefObject<HTMLDivElement | null>
  toggleSnap: () => void
  dragHandlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
    onMouseDown: (e: React.MouseEvent) => void
  }
}

// Vertical movement smaller than this threshold is treated as a tap, not a drag.
const TAP_THRESHOLD_PX = 10

export function useSheetDrag({ snapPoints, onDismiss }: UseSheetDragOptions): UseSheetDragResult {
  const [snapIndex, setSnapIndex] = useState<0 | 1>(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const startHeightPx = useRef(0)
  const isDragging = useRef(false)

  function snapTo(index: 0 | 1) {
    if (!sheetRef.current) return
    sheetRef.current.style.transition = 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)'
    sheetRef.current.style.height = `${snapPoints[index]}vh`
    setSnapIndex(index)
  }

  function onTouchStart(e: React.TouchEvent) {
    if (!sheetRef.current) return
    touchStartY.current = e.touches[0].clientY
    startHeightPx.current = sheetRef.current.getBoundingClientRect().height
    isDragging.current = true
    sheetRef.current.style.transition = 'none'
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isDragging.current || !sheetRef.current) return
    const delta = e.touches[0].clientY - touchStartY.current
    const newPx = startHeightPx.current - delta
    const minPx = (snapPoints[0] * window.innerHeight) / 100 * 0.4
    const maxPx = window.innerHeight * 0.97
    sheetRef.current.style.height = `${Math.max(minPx, Math.min(maxPx, newPx))}px`
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!isDragging.current || !sheetRef.current) return
    isDragging.current = false
    const delta = e.changedTouches[0].clientY - touchStartY.current

    // Treat near-zero movement as a tap: toggle between snap points.
    // `onClick` is suppressed by touchAction:'none' on real devices, so we
    // must detect the tap here instead.
    if (Math.abs(delta) < TAP_THRESHOLD_PX) {
      snapTo(snapIndex === 0 ? 1 : 0)
    } else if (delta < -50) {
      snapTo(1) // dragged up → expand
    } else if (delta > 80) {
      if (snapIndex === 0) {
        // dismiss with height animation
        sheetRef.current.style.transition = 'height 0.3s ease-in'
        sheetRef.current.style.height = '0px'
        setTimeout(onDismiss, 300)
      } else {
        snapTo(0) // dragged down from expanded → collapse
      }
    } else {
      snapTo(snapIndex) // not enough movement → snap back
    }
  }

  function onMouseDown(e: React.MouseEvent) {
    if (!sheetRef.current) return
    // Prevent text selection during drag
    e.preventDefault()
    touchStartY.current = e.clientY
    startHeightPx.current = sheetRef.current.getBoundingClientRect().height
    isDragging.current = true
    sheetRef.current.style.transition = 'none'

    function handleMouseMove(ev: MouseEvent) {
      if (!isDragging.current || !sheetRef.current) return
      const delta = ev.clientY - touchStartY.current
      const newPx = startHeightPx.current - delta
      const minPx = (snapPoints[0] * window.innerHeight) / 100 * 0.4
      const maxPx = window.innerHeight * 0.97
      sheetRef.current.style.height = `${Math.max(minPx, Math.min(maxPx, newPx))}px`
    }

    function handleMouseUp(ev: MouseEvent) {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)

      if (!isDragging.current || !sheetRef.current) return
      isDragging.current = false
      const delta = ev.clientY - touchStartY.current

      // Real drag: swallow the upcoming click so onClick={toggleSnap} doesn't fire
      if (Math.abs(delta) >= TAP_THRESHOLD_PX) {
        document.addEventListener('click', (ce) => ce.stopPropagation(), { capture: true, once: true })
      }

      if (Math.abs(delta) < TAP_THRESHOLD_PX) {
        snapTo(snapIndex === 0 ? 1 : 0)
      } else if (delta < -50) {
        snapTo(1)
      } else if (delta > 80) {
        if (snapIndex === 0) {
          sheetRef.current.style.transition = 'height 0.3s ease-in'
          sheetRef.current.style.height = '0px'
          setTimeout(onDismiss, 300)
        } else {
          snapTo(0)
        }
      } else {
        snapTo(snapIndex)
      }
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseup', handleMouseUp)
  }

  return {
    height: snapPoints[snapIndex],
    snapIndex,
    sheetRef,
    toggleSnap: () => snapTo(snapIndex === 0 ? 1 : 0),
    dragHandlers: { onTouchStart, onTouchMove, onTouchEnd, onMouseDown },
  }
}
