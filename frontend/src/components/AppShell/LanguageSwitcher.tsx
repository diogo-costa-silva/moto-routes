import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const lang = i18n.language

  function toggle(next: 'pt' | 'en') {
    if (lang !== next) i18n.changeLanguage(next)
  }

  return (
    <div
      className="flex items-center rounded-full border border-gray-700 bg-gray-900 text-xs font-medium overflow-hidden"
      aria-label={lang === 'pt' ? 'Mudar idioma' : 'Change language'}
    >
      <button
        onClick={() => toggle('pt')}
        className={[
          'px-2.5 py-1 transition-colors',
          lang === 'pt' ? 'text-white font-semibold' : 'text-gray-500 hover:text-gray-300',
        ].join(' ')}
        aria-pressed={lang === 'pt'}
      >
        PT
      </button>
      <span className="text-gray-700 select-none">/</span>
      <button
        onClick={() => toggle('en')}
        className={[
          'px-2.5 py-1 transition-colors',
          lang === 'en' ? 'text-white font-semibold' : 'text-gray-500 hover:text-gray-300',
        ].join(' ')}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
    </div>
  )
}
