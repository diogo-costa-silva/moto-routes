import type { Map as MapboxMap, LngLatBounds } from 'mapbox-gl'

export type SectionKey = 'routes' | 'journeys' | 'destinations'

interface CameraState {
  center: [number, number]
  zoom: number
  bearing: number
  pitch: number
}

const memory: Record<SectionKey, CameraState | null> = {
  routes: null,
  journeys: null,
  destinations: null,
}

/**
 * Save the map's current camera position for the given section.
 * Call this on section unmount (in useEffect cleanup).
 */
export function saveCameraMemory(section: SectionKey, map: MapboxMap): void {
  memory[section] = {
    center: map.getCenter().toArray() as [number, number],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  }
}

/**
 * Restore the saved camera position for the given section.
 * If no saved position exists, fit to defaultBounds (first visit).
 * If no defaultBounds either, do nothing (map stays at its current position).
 *
 * Call this on section mount, after confirming mapReady === true.
 */
export function restoreCameraMemory(
  section: SectionKey,
  map: MapboxMap,
  defaultBounds?: LngLatBounds,
): void {
  const saved = memory[section]
  if (saved) {
    map.easeTo({
      center: saved.center,
      zoom: saved.zoom,
      bearing: saved.bearing,
      pitch: saved.pitch,
      duration: 200,
    })
  } else if (defaultBounds) {
    map.fitBounds(defaultBounds, { padding: 60, duration: 1000, maxZoom: 12 })
  }
}
