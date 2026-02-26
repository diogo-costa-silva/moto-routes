import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useIsMobile } from '../hooks/useIsMobile'
import { useSheetDrag } from '../hooks/useSheetDrag'
import { NavHeader } from '../components/AppShell/NavHeader'
import { MobileTabBar } from '../components/AppShell/MobileTabBar'
import { JourneyMap } from '../components/Map/JourneyMap'
import { JourneyDetails, JourneyDetailsMobile } from '../components/Journeys/JourneyDetails'
import { JourneyList } from '../components/Journeys/JourneyList'
import { useJourneys } from '../hooks/useJourneys'

export function JourneysPage() {
  const { i18n, t } = useTranslation()
  const {
    journeys,
    loadingJourneys,
    error,
    selectedJourney,
    selectJourney,
    stages,
    loadingStages,
    stagesError,
    selectedStage,
    selectStage,
  } = useJourneys(i18n.language)

  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const isMobile = useIsMobile()
  const [showList, setShowList] = useState(false)
  const [sheetHeight, setSheetHeight] = useState(65)
  // Guard: pre-select only once (prevents re-select loop when closing)
  const didPreSelect = useRef(false)

  // Pre-select from URL slug — runs once when journeys load
  useEffect(() => {
    if (!didPreSelect.current && slug && journeys.length > 0) {
      const match = journeys.find((j) => j.slug === slug)
      if (match) {
        didPreSelect.current = true
        selectJourney(match)
      } else {
        didPreSelect.current = true
        toast.info('Journey not found')
        navigate('/journeys', { replace: true })
      }
    }
  }, [slug, journeys, selectJourney])

  // Sync URL when a journey is selected (only push if URL doesn't match)
  useEffect(() => {
    if (!selectedJourney) return
    const expected = `/journeys/${selectedJourney.slug}`
    if (location.pathname !== expected) {
      navigate(expected, { replace: true })
    }
  }, [selectedJourney, navigate, location.pathname])

  // Auto-close list sheet when a journey is selected on mobile
  useEffect(() => {
    if (selectedJourney) setShowList(false)
  }, [selectedJourney])

  const { sheetRef: listSheetRef, toggleSnap: toggleListSnap, dragHandlers: listDragHandlers } = useSheetDrag({
    snapPoints: [65, 95],
    onDismiss: () => setShowList(false),
  })

  function handleClose() {
    selectJourney(null)
    selectStage(null)
    navigate('/journeys', { replace: true })
    if (isMobile) setShowList(true)
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-950 text-white">
      <NavHeader />
      <div className="flex flex-1 min-h-0">
      {/* Sidebar: visible on lg+, hidden on mobile/tablet */}
      <div className="hidden lg:flex lg:w-80 flex-shrink-0 border-r border-gray-800 flex-col">
        {selectedJourney ? (
          <div className="flex-1 overflow-y-auto">
            <JourneyDetails
              journey={selectedJourney}
              stages={stages}
              selectedStage={selectedStage}
              loadingStages={loadingStages}
              stagesError={stagesError}
              onClose={handleClose}
              onStageSelect={selectStage}
            />
          </div>
        ) : (
          <>
            {error && (
              <div className="p-4 text-sm text-red-400">
                {t('journey.unableToLoad')}
              </div>
            )}
            <JourneyList
              journeys={journeys}
              loading={loadingJourneys}
              selectedJourney={selectedJourney}
              onSelect={selectJourney}
            />
          </>
        )}
      </div>

      {/* Map area */}
      <div className="relative flex-1">
        <JourneyMap
          stages={stages}
          selectedStage={selectedStage}
          isMobile={isMobile}
          bottomPanelHeight={isMobile ? window.innerHeight * (sheetHeight / 100) : undefined}
          onStageClick={selectStage}
        />

        {/* Mobile: journey details as bottom sheet */}
        {selectedJourney && (
          <JourneyDetailsMobile
            journey={selectedJourney}
            stages={stages}
            selectedStage={selectedStage}
            loadingStages={loadingStages}
            stagesError={stagesError}
            onClose={handleClose}
            onStageSelect={selectStage}
            onHeightChange={isMobile ? setSheetHeight : undefined}
          />
        )}
      </div>
      </div>

      {/* Mobile: floating pill — above tab bar (bottom-16 = 64px) */}
      {isMobile && !showList && !selectedJourney && (
        <button
          onClick={() => setShowList(true)}
          aria-label={t('journey.showList')}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white px-5 py-2 rounded-full shadow-lg text-sm font-medium"
        >
          {t('journey.heading')} ({loadingJourneys ? '…' : journeys.length})
        </button>
      )}

      {/* Mobile: bottom sheet for journey list */}
      {isMobile && showList && (
        <div
          ref={listSheetRef}
          className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950 rounded-t-2xl flex flex-col overflow-hidden"
          style={{ height: '65vh' }}
        >
          {/* Handle — drag only here */}
          <div
            style={{ touchAction: 'none' }}
            {...listDragHandlers}
            onClick={toggleListSnap}
            className="flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing flex-shrink-0"
          >
            <div className="h-1 w-10 rounded-full bg-gray-700" />
          </div>

          <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-800 flex-shrink-0">
            <span className="text-sm font-semibold text-gray-300">{t('journey.heading')}</span>
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
                {t('journey.unableToLoad')}
              </div>
            )}
            <JourneyList
              journeys={journeys}
              loading={loadingJourneys}
              selectedJourney={selectedJourney}
              onSelect={(j) => {
                selectJourney(j)
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
