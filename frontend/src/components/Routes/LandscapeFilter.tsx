import { useTranslation } from 'react-i18next'

export const LANDSCAPE_STYLES: Record<string, { pill: string; badge: string; icon: string }> = {
  coast:        { icon: '🌊', pill: 'border-blue-700 text-blue-300',    badge: 'bg-blue-900/40 text-blue-300' },
  mountain:     { icon: '⛰️', pill: 'border-purple-700 text-purple-300', badge: 'bg-purple-900/40 text-purple-300' },
  forest:       { icon: '🌲', pill: 'border-green-700 text-green-300',   badge: 'bg-green-900/40 text-green-300' },
  urban:        { icon: '🏙️', pill: 'border-gray-600 text-gray-300',     badge: 'bg-gray-800 text-gray-300' },
  river_valley: { icon: '🏞️', pill: 'border-cyan-700 text-cyan-300',     badge: 'bg-cyan-900/40 text-cyan-300' },
  mixed:        { icon: '🌅', pill: 'border-orange-700 text-orange-300', badge: 'bg-orange-900/40 text-orange-300' },
  plains:       { icon: '🌾', pill: 'border-yellow-700 text-yellow-300', badge: 'bg-yellow-900/40 text-yellow-300' },
}

interface LandscapeFilterProps {
  availableTypes: string[]
  selected: string[]
  onChange: (types: string[]) => void
}

export function LandscapeFilter({ availableTypes, selected, onChange }: LandscapeFilterProps) {
  const { t } = useTranslation()

  if (availableTypes.length === 0) return null

  function toggle(type: string) {
    if (selected.includes(type)) {
      onChange(selected.filter(s => s !== type))
    } else {
      onChange([...selected, type])
    }
  }

  return (
    <div className="overflow-x-auto flex gap-2 px-4 py-2 scrollbar-none">
      {availableTypes.map(type => {
        const style = LANDSCAPE_STYLES[type] ?? { icon: '', pill: 'border-gray-600 text-gray-300', badge: 'bg-gray-800 text-gray-300' }
        const isActive = selected.includes(type)
        return (
          <button
            key={type}
            onClick={() => toggle(type)}
            aria-pressed={isActive}
            className={`flex-none flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${style.pill} ${isActive ? style.badge : 'bg-transparent'}`}
          >
            <span>{style.icon}</span>
            <span>{t(`landscape.${type}`, type)}</span>
          </button>
        )
      })}
      {selected.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="flex-none flex items-center gap-1 rounded-full border border-gray-600 px-3 py-1 text-xs font-medium text-gray-400 hover:border-gray-400 hover:text-white transition-colors"
          aria-label={t('filter.clearAll')}
        >
          <span>✕</span>
          <span>{t('filter.clearAll')}</span>
        </button>
      )}
    </div>
  )
}
