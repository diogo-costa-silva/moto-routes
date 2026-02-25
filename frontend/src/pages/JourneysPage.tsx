import { useEffect, useState } from 'react'
import { NavHeader } from '../components/AppShell/NavHeader'
import { MobileTabBar } from '../components/AppShell/MobileTabBar'
import { JourneyMap } from '../components/Map/JourneyMap'
import { JourneyDetails, JourneyDetailsMobile } from '../components/Journeys/JourneyDetails'
import { JourneyList } from '../components/Journeys/JourneyList'
import { useJourneys } from '../hooks/useJourneys'

export function JourneysPage() {
  const {
    journeys,
    loadingJourneys,
    selectedJourney,
    selectJourney,
    stages,
    loadingStages,
    selectedStage,
    selectStage,
  } = useJourneys()

  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [showList, setShowList] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Auto-close list sheet when a journey is selected on mobile
  useEffect(() => {
    if (selectedJourney) setShowList(false)
  }, [selectedJourney])

  function handleClose() {
    selectJourney(null)
    selectStage(null)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950 text-white">
      {/* Sidebar: visible on md+, hidden on mobile */}
      <div className="hidden md:flex md:w-80 flex-shrink-0 border-r border-gray-800 flex-col">
        <NavHeader />

        {selectedJourney ? (
          <div className="flex-1 overflow-y-auto">
            <JourneyDetails
              journey={selectedJourney}
              stages={stages}
              selectedStage={selectedStage}
              loadingStages={loadingStages}
              onClose={handleClose}
              onStageSelect={selectStage}
            />
          </div>
        ) : (
          <JourneyList
            journeys={journeys}
            loading={loadingJourneys}
            selectedJourney={selectedJourney}
            onSelect={selectJourney}
          />
        )}
      </div>

      {/* Map area */}
      <div className="relative flex-1">
        <JourneyMap
          stages={stages}
          selectedStage={selectedStage}
          isMobile={isMobile}
          bottomPanelHeight={isMobile ? window.innerHeight * 0.55 : undefined}
          onStageClick={selectStage}
        />

        {/* Mobile: journey details as bottom sheet */}
        {selectedJourney && (
          <JourneyDetailsMobile
            journey={selectedJourney}
            stages={stages}
            selectedStage={selectedStage}
            loadingStages={loadingStages}
            onClose={handleClose}
            onStageSelect={selectStage}
          />
        )}
      </div>

      {/* Mobile: floating pill — above tab bar (bottom-16 = 64px) */}
      {isMobile && !showList && !selectedJourney && (
        <button
          onClick={() => setShowList(true)}
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white px-5 py-2 rounded-full shadow-lg text-sm font-medium"
        >
          Journeys ({loadingJourneys ? '…' : journeys.length})
        </button>
      )}

      {/* Mobile: bottom sheet for journey list */}
      {isMobile && showList && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950 rounded-t-2xl h-[55vh] flex flex-col">
          <div className="flex items-center justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-gray-700" />
          </div>

          <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-800">
            <span className="text-sm font-semibold text-gray-300">Journeys</span>
            <button
              onClick={() => setShowList(false)}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
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
