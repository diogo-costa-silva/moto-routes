import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useIsMobile } from '../hooks/useIsMobile'
import { NavHeader } from '../components/AppShell/NavHeader'
import { MobileTabBar } from '../components/AppShell/MobileTabBar'
import { DestinationMap } from '../components/Map/DestinationMap'
import { DestinationDetails, DestinationDetailsMobile } from '../components/Destinations/DestinationDetails'
import { DestinationList } from '../components/Destinations/DestinationList'
import { useDestinations } from '../hooks/useDestinations'

export function DestinationsPage() {
  const { i18n, t } = useTranslation()
  const {
    destinations,
    loadingDestinations,
    error,
    selectedDestination,
    selectDestination,
    featuredRoutes,
    loadingRoutes,
  } = useDestinations(i18n.language)

  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const isMobile = useIsMobile()
  const [showList, setShowList] = useState(false)
  // Guard: track last pre-selected slug to support browser history navigation
  const lastPreSelectedSlug = useRef<string | null>(null)

  // Pre-select from URL slug — re-runs when slug changes (back/forward navigation)
  useEffect(() => {
    if (lastPreSelectedSlug.current !== slug && slug && destinations.length > 0) {
      const match = destinations.find((d) => d.slug === slug)
      if (match) {
        lastPreSelectedSlug.current = slug
        selectDestination(match)
      } else {
        lastPreSelectedSlug.current = slug
        toast.info('Region not found')
        navigate('/destinations', { replace: true })
      }
    }
  }, [slug, destinations, selectDestination])

  // Sync URL when a destination is selected (only push if URL doesn't match)
  useEffect(() => {
    if (!selectedDestination) return
    const expected = `/destinations/${selectedDestination.slug}`
    if (location.pathname !== expected) {
      navigate(expected, { replace: true })
    }
  }, [selectedDestination, navigate, location.pathname])

  // Auto-close list sheet when a destination is selected on mobile
  useEffect(() => {
    if (selectedDestination) setShowList(false)
  }, [selectedDestination])

  const listSheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number>(0)
  const dragging = useRef<boolean>(false)

  function onSheetTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY
    dragging.current = true
  }

  function onSheetTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return
    const delta = e.touches[0].clientY - dragStartY.current
    if (delta > 0 && listSheetRef.current) {
      listSheetRef.current.style.transform = `translateY(${delta}px)`
    }
  }

  function onSheetTouchEnd(e: React.TouchEvent) {
    dragging.current = false
    const delta = e.changedTouches[0].clientY - dragStartY.current
    if (listSheetRef.current) {
      listSheetRef.current.style.transform = ''
      listSheetRef.current.style.transition = 'transform 0.2s ease'
      setTimeout(() => {
        if (listSheetRef.current) listSheetRef.current.style.transition = ''
      }, 200)
    }
    if (delta > 80) {
      setShowList(false)
    }
  }

  function handleClose() {
    selectDestination(null)
    navigate('/destinations', { replace: true })
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950 text-white">
      <NavHeader />
      <div className="flex flex-1 min-h-0">
      {/* Sidebar: visible on lg+, hidden on mobile/tablet */}
      <div className="hidden lg:flex lg:w-80 flex-shrink-0 border-r border-gray-800 flex-col">
        {error && (
          <div className="p-4 text-sm text-red-400">
            {t('destination.unableToLoad')}
          </div>
        )}

        {!error && selectedDestination ? (
          <div className="flex-1 overflow-y-auto">
            <DestinationDetails
              destination={selectedDestination}
              featuredRoutes={featuredRoutes}
              loadingRoutes={loadingRoutes}
              onClose={handleClose}
            />
          </div>
        ) : !error ? (
          <DestinationList
            destinations={destinations}
            loading={loadingDestinations}
            selectedDestination={selectedDestination}
            onSelect={selectDestination}
          />
        ) : null}
      </div>

      {/* Map area */}
      <div className="relative flex-1">
        <DestinationMap
          destination={selectedDestination}
          featuredRoutes={featuredRoutes}
          isMobile={isMobile}
          bottomPanelHeight={isMobile ? window.innerHeight * 0.55 : undefined}
        />

        {/* Mobile: destination details as bottom sheet */}
        {selectedDestination && (
          <DestinationDetailsMobile
            destination={selectedDestination}
            featuredRoutes={featuredRoutes}
            loadingRoutes={loadingRoutes}
            onClose={handleClose}
          />
        )}
      </div>
      </div>

      {/* Mobile: floating pill — above tab bar */}
      {isMobile && !showList && !selectedDestination && (
        <button
          onClick={() => setShowList(true)}
          aria-label={t('destination.showList')}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white px-5 py-2 rounded-full shadow-lg text-sm font-medium"
        >
          {t('destination.heading')} ({loadingDestinations ? '…' : destinations.length})
        </button>
      )}

      {/* Mobile: bottom sheet for destination list */}
      {isMobile && showList && (
        <div
          ref={listSheetRef}
          className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950 rounded-t-2xl h-[55vh] flex flex-col"
          onTouchStart={onSheetTouchStart}
          onTouchMove={onSheetTouchMove}
          onTouchEnd={onSheetTouchEnd}
        >
          <div className="flex items-center justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-gray-700" />
          </div>

          <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-800">
            <span className="text-sm font-semibold text-gray-300">{t('destination.heading')}</span>
            <button
              onClick={() => setShowList(false)}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              aria-label={t('common.close')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pb-16">
            {error && (
              <div className="p-4 text-sm text-red-400">
                {t('destination.unableToLoad')}
              </div>
            )}
            <DestinationList
              destinations={destinations}
              loading={loadingDestinations}
              selectedDestination={selectedDestination}
              onSelect={(d) => {
                selectDestination(d)
                setShowList(false)
              }}
            />
          </div>
        </div>
      )}

      <MobileTabBar />
    </div>
  )
}
