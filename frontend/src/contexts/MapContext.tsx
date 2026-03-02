import { createContext, useContext, useRef, useState } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'

export interface MapContextValue {
  mapRef: React.RefObject<MapboxMap | null>
  mapReady: boolean
  setMapReady: (ready: boolean) => void
}

const MapContext = createContext<MapContextValue | null>(null)

export function MapProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<MapboxMap | null>(null)
  const [mapReady, setMapReady] = useState(false)

  return (
    <MapContext.Provider value={{ mapRef, mapReady, setMapReady }}>
      {children}
    </MapContext.Provider>
  )
}

export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext)
  if (!ctx) throw new Error('useMapContext must be used within MapProvider')
  return ctx
}
