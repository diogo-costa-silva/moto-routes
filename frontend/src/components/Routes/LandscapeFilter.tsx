import { useTranslation } from 'react-i18next'

export const LANDSCAPE_STYLES: Record<string, { pill: string; badge: string; icon: string }> = {
  coast:        { icon: '🌊', pill: 'border-blue-600 text-blue-300',    badge: 'bg-blue-500/20 text-blue-400' },
  mountain:     { icon: '⛰️', pill: 'border-purple-600 text-purple-300', badge: 'bg-purple-500/20 text-purple-400' },
  forest:       { icon: '🌲', pill: 'border-green-600 text-green-300',   badge: 'bg-green-500/20 text-green-400' },
  urban:        { icon: '🏙️', pill: 'border-slate-500 text-slate-200',   badge: 'bg-slate-500/20 text-slate-300' },
  river_valley: { icon: '🏞️', pill: 'border-cyan-600 text-cyan-300',     badge: 'bg-cyan-500/20 text-cyan-400' },
  mixed:        { icon: '🌅', pill: 'border-orange-600 text-orange-300', badge: 'bg-orange-500/20 text-orange-400' },
  plains:       { icon: '🌾', pill: 'border-yellow-600 text-yellow-300', badge: 'bg-yellow-500/20 text-yellow-400' },
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
        const style = LANDSCAPE_STYLES[type] ?? { icon: '', pill: 'border-gray-500 text-gray-300', badge: 'bg-gray-500/20 text-gray-300' }
        const isActive = selected.includes(type)
        return (
          <button
            key={type}
            onClick={() => toggle(type)}
            aria-pressed={isActive}
            className={`flex-none flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-950 focus:ring-gray-400 ${style.pill} ${isActive ? style.badge : 'bg-transparent hover:bg-gray-800'}`}
          >
            <span>{style.icon}</span>
            <span>{t(`landscape.${type}`, { defaultValue: type })}</span>
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
