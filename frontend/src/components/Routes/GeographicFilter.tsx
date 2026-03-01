import { useEffect, useRef, useState } from 'react'
import { useGeographicAreas } from '../../hooks/useGeographicAreas'
import type { GeographicArea } from '../../types/database'

interface GeographicFilterProps {
  selectedArea: GeographicArea | null
  breadcrumb: GeographicArea[]
  onSelectArea: (area: GeographicArea | null) => void
}

export function GeographicFilter({ selectedArea, breadcrumb, onSelectArea }: GeographicFilterProps) {
  const [open, setOpen] = useState(false)
  const [browsedParent, setBrowsedParent] = useState<GeographicArea | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load children of the currently browsed parent (or root)
  const { areas, loading } = useGeographicAreas(browsedParent?.id ?? null, null)

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // When opening, reset browse to root
  function handleToggle() {
    if (!open) setBrowsedParent(null)
    setOpen(v => !v)
  }

  function handleSelectArea(area: GeographicArea) {
    onSelectArea(area)
    setOpen(false)
  }

  function handleDrillDown(area: GeographicArea, e: React.MouseEvent) {
    e.stopPropagation()
    setBrowsedParent(area)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onSelectArea(null)
  }

  const showFilter = areas.length > 0 || selectedArea !== null

  if (!showFilter && !loading) return null

  return (
    <div ref={dropdownRef} className="relative border-b border-gray-800 px-3 py-2">
      {/* Trigger */}
      <button
        onClick={handleToggle}
        className={[
          'w-full flex items-center justify-between text-sm rounded-lg px-3 py-2 transition-colors',
          selectedArea
            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-700',
        ].join(' ')}
      >
        <span className="flex items-center gap-2 truncate">
          <span className="text-base">🗺</span>
          {selectedArea ? (
            <span className="truncate">{breadcrumb.map(a => a.name).join(' › ')}</span>
          ) : (
            <span>Filtrar por área</span>
          )}
        </span>
        <span className="flex items-center gap-1 flex-shrink-0">
          {selectedArea && (
            <span
              onClick={handleClear}
              className="text-gray-500 hover:text-white cursor-pointer p-0.5 rounded"
              title="Limpar filtro"
            >
              ×
            </span>
          )}
          <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {/* Breadcrumb nav */}
          {browsedParent && (
            <div className="px-3 py-2 border-b border-gray-700 flex items-center gap-1 text-xs text-gray-400">
              <button onClick={() => setBrowsedParent(null)} className="hover:text-white">Raiz</button>
              <span>›</span>
              <span className="text-gray-300">{browsedParent.name}</span>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-500">A carregar...</div>
            ) : areas.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">Sem subáreas</div>
            ) : (
              areas.map(area => (
                <div key={area.id} className="flex items-center group">
                  <button
                    onClick={() => handleSelectArea(area)}
                    className="flex-1 text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <span>{area.name}</span>
                    {area.route_count > 0 && (
                      <span className="ml-2 text-xs text-gray-500">({area.route_count})</span>
                    )}
                  </button>
                  {/* Drill-down arrow (only if has children, indicated by non-leaf levels) */}
                  {(['continent', 'country', 'macro_region', 'historic_province'] as string[]).includes(area.level) && (
                    <button
                      onClick={e => handleDrillDown(area, e)}
                      className="px-2 py-2 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Ver subáreas"
                    >
                      ›
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
