import { useTranslation } from 'react-i18next'

interface FavoriteButtonProps {
  routeId: string
  isFavorite: boolean
  onToggle: () => void
  isAuthenticated: boolean
  onLoginRequired: () => void
  loading?: boolean
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  isAuthenticated,
  onLoginRequired,
  loading = false,
}: FavoriteButtonProps) {
  const { t } = useTranslation()

  function handleClick() {
    if (!isAuthenticated) {
      onLoginRequired()
      return
    }
    onToggle()
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={isFavorite ? t('favorite.remove') : t('favorite.add')}
      className="flex-shrink-0 flex items-center justify-center h-11 w-11 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
    >
      {loading ? (
        <svg className="h-5 w-5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 transition-colors ${isFavorite ? 'text-amber-500' : 'text-gray-500 hover:text-gray-300'}`}
          viewBox="0 0 24 24"
          fill={isFavorite ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={isFavorite ? 0 : 2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  )
}
