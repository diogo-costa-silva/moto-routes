import { useTranslation } from 'react-i18next'
import { LANDSCAPE_STYLES } from './landscapeStyles'

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
