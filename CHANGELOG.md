# Changelog

Todas as mudanças notáveis neste projecto serão documentadas neste ficheiro.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased]

### Melhorado — Mobile bottom sheet drag
- `useSheetDrag.ts` — reescrito com drag em tempo real: `sheetRef` para manipulação directa do DOM, `onTouchMove` move o sheet pixel a pixel, dismiss animado (height → 0px em 300ms), snap com `cubic-bezier(0.32, 0.72, 0, 1)` (iOS-like)
- `RouteDetails.tsx` + `JourneyDetailsMobile` + `DestinationDetailsMobile` — drag restrito ao handle bar (`touchAction: none`); outer div usa `flex flex-col overflow-hidden`; scroll do conteúdo no inner div sem conflito com drag
- `RoutesPage.tsx` + `JourneysPage.tsx` + `DestinationsPage.tsx` — list sheets migradas para `useSheetDrag`; snap points `[65, 90]vh` (era fixed 55vh); drag para cima expande, para baixo colapsa ou fecha

### Corrigido — Bug fixes & UX (friend testing feedback)
- `translations.ts` + `useRoutes.ts` + `useJourneys.ts` + `useDestinations.ts` — `fetchTranslations` chamado com tipos singulares (`'route'`, `'journey'`, `'destination'`) mas a BD guarda plurais (`'routes'`, `'journeys'`, `'destinations'`); corrigidos todos os 5 call sites — descrições em inglês agora carregam correctamente
- `DestinationMap.tsx` — posição inicial do mapa harmonizada com Routes/Journeys (`center: [-7.9, 41.0], zoom: 7`)
- `DestinationMap.tsx` — clicar em área vazia do mapa agora deselecciona a região activa
- `RoutesPage.tsx` + `JourneysPage.tsx` + `DestinationsPage.tsx` — fechar painel de detalhe no mobile agora reabre automaticamente a lista de items
- `useSheetDrag.ts` (novo hook) — dois snap points (55vh / 75vh) com detecção de drag; arrastar para cima expande, arrastar para baixo colapsa ou fecha
- `RouteDetails.tsx` + `JourneyDetailsMobile` + `DestinationDetailsMobile` — bottom sheet com drag real; drag handle clicável para alternar entre 55vh e 75vh; arrastar 80px para baixo fecha o painel
- Pages actualizadas para propagar `sheetHeight` ao mapa via `bottomPanelHeight`

### Corrigido — Auth UI
- `LoginModal.tsx` — erros do Supabase traduzidos para PT/EN (era "Invalid login credentials" em inglês)
- `LoginModal.tsx` — estado do formulário (campos + erro + modo) agora limpa ao reabrir o modal
- `locales/pt.json` + `locales/en.json` — 5 novas chaves `auth.error*` adicionadas

## [0.12.0] - 2026-02-26

### Adicionado — Fase 10: Deploy Vercel

- `frontend/vercel.json` — `outputDirectory: "dist"` + SPA rewrites para BrowserRouter; ficheiro deve estar em `frontend/` com Root Directory = `frontend` nas settings Vercel
- `frontend/package.json` — script `typecheck: tsc --noEmit` adicionado
- `docs/DEPLOYMENT.md` — guia completo e discriminado com os passos reais: criar repo GitHub, importar no Vercel, configurar env vars, definir Root Directory, Supabase Auth pós-deploy, troubleshooting
- GitHub repo: `diogo-costa-silva/moto-routes` (público)
- Vercel: `moto-routes.vercel.app` — deploy production activo
- Supabase Auth: Site URL + Redirect URLs actualizados para `https://moto-routes.vercel.app`

## [0.11.1] - 2026-02-26

### Fixed — Auditoria UI/UX (Phase 10 prep)

- `RouteList.tsx`, `RouteDetails.tsx` — `difficulty` e `surface` agora usam `t()` em vez de renderizar o valor raw; mostram "Intermédio"/"Avançado"/"Principiante" e "Asfalto"/"Terra"/"Misto" em PT
- `pt.json`, `en.json` — adicionadas chaves `difficulty.*`, `surface.*` e `profile.signInToView`
- `ProfilePage.tsx` — redirect para utilizadores não autenticados movido para `useEffect` (elimina side-effect no corpo do render e toast duplicado); toast usa `t('profile.signInToView')`
- `App.tsx` — `<ErrorBoundary>` agora envolve `<Routes>`; erros de render são capturados em vez de crashar toda a app
- `vite.config.ts` — `manualChunks` separa mapbox-gl, @supabase/supabase-js e i18next em chunks independentes; bundle principal reduzido de 2.27 MB para 339 KB

## [0.11.0] - 2026-02-26

### Adicionado — Fase 9: Landscape Tags

- `LandscapeFilter.tsx` — componente de filtro multi-select por tipo de paisagem; pills coloridos por tipo (cyan costa, purple montanha, green floresta, cyan vale do rio, orange misto, yellow planícies); botão "✕ Limpar" quando há filtros activos; `aria-pressed` em cada pill; scrollable horizontal
- `LANDSCAPE_STYLES` — mapa de estilos (icon + pill + badge) exportado e partilhado com `RouteList`
- Filtro integrado no sidebar desktop (acima da lista) e no bottom sheet mobile (entre header e lista)
- Estado `landscapeFilters` + `filteredRoutes` via `useMemo` em `RoutesPage` — apenas rotas do tipo seleccionado aparecem na lista e no mapa
- Pill flutuante "Rotas (N)" mostra badge laranja com contagem de filtros activos
- Strings i18n `filter.allTypes`, `filter.filterBy`, `filter.clearAll` em PT/EN

### Alterado

- `RouteList.tsx` — badges de landscape agora coloridos (usa `LANDSCAPE_STYLES`); prop `showHeader` permite ocultar o cabeçalho quando embebido no bottom sheet
- `NavHeader.tsx` — `hidden lg:flex`: header oculto em mobile/tablet (<1024px); `MobileTabBar` serve toda a navegação abaixo desse breakpoint

### Fixed — Desktop navigation layout

- Lifted `NavHeader` out of the 320px sidebar in `RoutesPage`, `JourneysPage`, `DestinationsPage`
- NavHeader now spans the full viewport width on desktop; all three nav links (Rotas/Viagens/Regiões) are visible
- Inner sidebar+map row wrapped in `flex flex-1 min-h-0` to prevent overflow
- Removed `flex-shrink-0` from `NavHeader` root div (no longer inside a flex column)

## [0.10.0] - 2026-02-26

### Adicionado — Fase 8: Multilingue PT/EN

- `i18n/index.ts` — configuração i18next com `i18next-browser-languagedetector`; detecção por `localStorage` key `language`, fallback `navigator`
- `locales/pt.json` + `locales/en.json` — 87 strings em PT/EN (nav, auth, route, poi, favorite, journey, destination, profile, landscape, common)
- `lib/translations.ts` — utilitário para buscar traduções da tabela `translations` por `entity_type` + `lang`
- `LanguageSwitcher.tsx` — componente PT/EN pill; visível no `NavHeader` (desktop) e floating acima da `MobileTabBar` (mobile)
- `useRoutes`, `useJourneys`, `useDestinations` — recebem `lang` param; buscam traduções em paralelo via `Promise.all`; nomes e descrições substituídos pelos valores da BD

### Alterado

- `NavHeader.tsx` — `navSections` movido para dentro do componente; labels via `t()`; `LanguageSwitcher` + `Sign in` → `t('nav.signIn')`
- `MobileTabBar.tsx` — `navTabs` movido para dentro do componente; labels via `t()`; `LanguageSwitcher` floating acima da tab bar
- `RoutesPage`, `JourneysPage`, `DestinationsPage` — passam `i18n.language` aos hooks de dados; error messages via `t()`
- `ProfilePage` — `relativeTime()` recebe `t` e `lang` para localização; all strings via `t()`
- 9 componentes — todas as strings hardcoded substituídas por `t()` (LoginModal, UserMenu, RouteList, RouteDetails, POIList, FavoriteButton, JourneyList, JourneyDetails, DestinationList, DestinationDetails)

### Removido

- `lib/labels.ts` — substituído por `t('landscape.*')` em todos os call sites

## [0.9.1] - 2026-02-26

### Corrigido — Reorganização UI/UX estratégica (Fases A–E)

**Layout crítico (Fase A)**
- `NavHeader.tsx` — substituído texto "Moto Routes" por ícone SVG de mota; resolve overflow do link "Regions" em viewports estreitas
- `RouteDetails`, `JourneyDetails`, `DestinationDetails` — bottom sheets adicionam `pb-20` para conteúdo não ficar tapado pela `MobileTabBar`
- `ProfilePage.tsx` — toast `"Sign in to view your profile"` antes de redirecionar utilizadores não autenticados
- `MobileTabBar.tsx` — tab Profile abre `LoginModal` para utilizadores não autenticados em vez de redirecionar silenciosamente
- `RoutesPage.tsx` — `bottomPanelHeight` corrigido de 0.5 para 0.55 (consistente com sheet height)

**Responsivo tablet (Fase B)**
- `useIsMobile.ts` — breakpoint alterado de 768 para 1024px; tablet portrait (768px) usa layout mobile, tablet landscape+ usa sidebar
- `RoutesPage`, `JourneysPage`, `DestinationsPage` — sidebar: `hidden md:flex md:w-80` → `hidden lg:flex lg:w-80`
- `RouteDetails`, `JourneyDetails`, `DestinationDetails` — bottom sheets: `md:hidden` → `lg:hidden`
- `MobileTabBar.tsx` — `md:hidden` → `lg:hidden`
- `RouteMap`, `DestinationMap` — `fitBounds` padding esquerdo: 40 → 340px (acomoda sidebar 320px + margem)

**Acessibilidade WCAG 2.1 AA (Fase C)**
- `LoginModal.tsx` — `role="dialog"` + `aria-modal` + `aria-labelledby`; focus trap manual; labels sr-only para inputs; `role="alert"` em erros; loading state no botão Google; `focus-visible` rings
- `UserMenu.tsx` — `aria-haspopup="menu"` + `aria-expanded`; `role="menu"` + `role="menuitem"`; navegação por setas ↑↓; ESC fecha
- `ProfilePage.tsx` — tabs com `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`; panels com `role="tabpanel"`, `aria-labelledby`, `hidden`
- `MobileTabBar.tsx` — SVGs com `aria-hidden="true"`; links activos com `aria-current="page"`; `role="navigation"` + `aria-label`
- `FavoriteButton.tsx` — `focus-visible:ring-2 focus-visible:ring-orange-500` para navegação por teclado
- Pill buttons (Routes/Journeys/Regions) — `aria-label` descritivo adicionado

**Mapa e consistência visual (Fase D)**
- `RouteMap.tsx` — popup POI: dark theme (`bg gray-950`, `color gray-50`) via classe CSS `.dark-popup`; `closeButton: false`
- `index.css` — estilos `.dark-popup` para popup Mapbox consistente com dark UI
- `mapLayers.ts` — `addDestinationLayers` agora adiciona fill (amber, opacidade 0.2) + outline dashed (amber, 3px) para bbox polygon; layers adicionados antes das route lines
- `DestinationMap.tsx` — chama `updateDestinationBBoxSource` ao seleccionar destino; `fitBounds` estende para incluir bbox + routes (evitava bbox fora do viewport); limpa bbox ao deseleccionar
- `DestinationList.tsx` — empty state "No regions found"; border `border-transparent` → `border-gray-800` (elimina layout shift de 1px no hover)
- `JourneyDetails.tsx` — botão download GPX com `whitespace-nowrap`

**Erro e UX minor (Fase E)**
- `RouteDetails.tsx` — botão "Download GPX" com loading state (spinner + `disabled` durante download)

## [0.9.0] - 2026-02-25

### Adicionado — Phase 7: Frontend Users (Auth + Favourites + History)
- `hooks/useAuth.ts` — autenticação via Supabase: email/password + Google OAuth; `getSession()` no mount + `onAuthStateChange` listener; actions `login`, `signup`, `loginWithGoogle`, `logout`
- `hooks/useFavorites.ts` — favoritos persistentes; optimistic update com rollback em caso de erro; `isFavorite(routeId)` O(1) via `Set<string>`; chama `useAuth()` internamente
- `hooks/useHistory.ts` — histórico de rotas vistas (últimas 20); `recordView(routeId)` fire-and-forget com refresh automático; chama `useAuth()` internamente
- `components/Auth/LoginModal.tsx` — modal de login/signup com email+password e botão Google OAuth; backdrop click + ESC fecha; spinner de submissão; erro inline
- `components/Auth/UserMenu.tsx` — avatar com Google photo ou iniciais; dropdown com "My Profile" e "Sign out"; fecha ao clicar fora
- `components/Routes/FavoriteButton.tsx` — botão de favorito presentacional (sem hooks internos); 44px touch target; states: heart outline/filled/spinner
- `pages/ProfilePage.tsx` — página de perfil com tabs Favourites/History; skeleton loaders; empty states; redirect para /routes se não autenticado
- Rota `/profile` em `App.tsx`
- Tab "Profile" em `MobileTabBar.tsx`
- Área de auth em `NavHeader.tsx` (botão "Sign in" ou `UserMenu`)

### Alterado
- `components/Routes/RouteDetails.tsx` — header com `FavoriteButton` ao lado do botão close; novas props: `isFavorite`, `isAuthenticated`, `onToggleFavorite`, `onLoginRequired`
- `pages/RoutesPage.tsx` — integração de `useAuth`, `useFavorites`, `useHistory`; debounce de 2s para `recordView`; `LoginModal` inline para rotas não autenticadas

## [0.8.7] - 2026-02-25

### Adicionado
- `hooks/useIsMobile.ts` — hook partilhado para detecção de breakpoint mobile via `matchMedia`; substitui o padrão `useState + useEffect` repetido nas 3 pages
- `lib/labels.ts` — constante `LANDSCAPE_LABELS` centralizada; elimina a definição duplicada em `RouteList`, `RouteDetails` e `DestinationDetails`

### Alterado
- `pages/RoutesPage.tsx`, `pages/JourneysPage.tsx`, `pages/DestinationsPage.tsx` — removido bloco `useState + useEffect` de isMobile; substituído por `useIsMobile()`
- `components/Routes/RouteList.tsx`, `components/Routes/RouteDetails.tsx`, `components/Destinations/DestinationDetails.tsx` — removida constante local `LANDSCAPE_LABELS`; importada de `lib/labels`
- `components/AppShell/MobileTabBar.tsx` — adicionado indicador geométrico no topo de cada tab activo (`h-0.5 w-8 bg-orange-500`); container do link tem `relative`

## [0.8.6] - 2026-02-25

### Adicionado
- `pages/RoutesPage.tsx` — swipe-to-dismiss na bottom sheet da lista: `listSheetRef`, `dragStartY`, `dragging` refs + handlers `onSheetTouchStart/Move/End`; fecha quando o utilizador arrasta > 80px para baixo; snap-back animado (0.2s) quando o gesto não atinge o threshold
- `pages/JourneysPage.tsx` — mesmo padrão swipe-to-dismiss aplicado na bottom sheet da lista de journeys
- `pages/DestinationsPage.tsx` — mesmo padrão swipe-to-dismiss aplicado na bottom sheet da lista de regiões

## [0.8.5] - 2026-02-25

### Adicionado
- `hooks/useDestinations.ts` — expõe campo `error: string | null`; definido em caso de falha no fetch de destinations
- `pages/DestinationsPage.tsx` — error state visível no sidebar desktop quando `useDestinations` retorna erro
- `components/Destinations/DestinationList.tsx` — header com título "Regions" e contagem `(N)`, seguindo o padrão de RouteList e JourneyList

### Corrigido
- `pages/DestinationsPage.tsx` — guard de pre-selecção mudado de `boolean` para `string | null` (`lastPreSelectedSlug`); agora re-selecciona correctamente quando o utilizador navega via browser history para um slug diferente
- `components/Destinations/DestinationDetails.tsx` — empty state "No featured routes." muda de `text-gray-600` para `text-gray-400` (contraste melhorado sobre `bg-gray-950`)
- `components/Destinations/DestinationDetails.tsx` — `DestinationDetailsMobile` bottom sheet: adicionado `pb-[env(safe-area-inset-bottom,0px)]` para iOS gesture bar

## [0.8.4] - 2026-02-25

### Adicionado
- `hooks/useJourneys.ts` — expõe campo `error: string | null`; definido em caso de falha no fetch de journeys
- `pages/JourneysPage.tsx` — URL sync: pre-selecção a partir de slug na URL (ex: `/journeys/douro-valley`); sincronização da URL quando um journey é seleccionado; `handleClose` navega para `/journeys`; guard `didPreSelect` evita loop de re-selecção
- `pages/JourneysPage.tsx` — error state visível no sidebar desktop e no mobile bottom sheet quando `useJourneys` retorna erro
- `components/Journeys/JourneyList.tsx` — empty state "No journeys found." quando `!loading && journeys.length === 0`

### Corrigido
- `components/Journeys/JourneyDetails.tsx` — botão de fechar: `p-1.5` aumentado para `p-2.5 min-w-[44px] min-h-[44px]` (tap target mínimo de 44px)
- `components/Journeys/JourneyDetails.tsx` — botão de download GPX por stage: `p-1.5` aumentado para `p-2.5 min-w-[44px] min-h-[44px]` (tap target mínimo de 44px)
- `components/Journeys/JourneyDetails.tsx` — `JourneyDetailsMobile` bottom sheet: adicionado `pb-[env(safe-area-inset-bottom,0px)]` para iOS gesture bar

## [0.8.3] - 2026-02-25

### Adicionado
- `App.tsx` — rotas `/routes/:slug` e `/journeys/:slug` adicionadas ao router
- `pages/RoutesPage.tsx` — URL sync: pre-selecção a partir de slug na URL (ex: `/routes/n222`); sincronização da URL quando uma rota é seleccionada; `handleClose` navega para `/routes`
- `components/Routes/RouteList.tsx` — empty state "No routes found." quando `!loading && routes.length === 0`

### Corrigido
- `components/Routes/RouteDetails.tsx` — altura do bottom sheet mobile alterada de `h-[50vh]` para `h-[55vh]` (consistência com Journeys/Destinations); adicionado `pb-[env(safe-area-inset-bottom,0px)]` para iOS gesture bar
- `pages/RoutesPage.tsx` — error state visível no sidebar desktop quando `useRoutes` retorna erro

## [0.8.2] - 2026-02-25

### Corrigido
- `components/Map/DestinationMap.tsx` — removido `boundsFromPolygon` como fonte primária de zoom; substituído por `boundsFromRoutes` que calcula bounds a partir das coordenadas das rotas featured; `boundsFromPolygon` mantido apenas como fallback quando não há rotas
- `components/Map/DestinationMap.tsx` — removidas chamadas a `updateDestinationBBoxSource` (polígono rectangular já não é actualizado)
- `components/Map/mapLayers.ts` — removidos layers `LAYER_DESTINATION_FILL` e `LAYER_DESTINATION_OUTLINE` de `addDestinationLayers`; source `SOURCE_DESTINATION_BBOX` mantida para não quebrar código de terceiros

## [0.8.1] - 2026-02-25

### Documentação
- `docs/ROADMAP.md` — Phase 5 marcada como COMPLETE (merged GPX critério satisfeito em `22a9760`); Phase 6 marcada como COMPLETE com componentes e critérios actualizados para reflectir implementação real (slugs EN, sem componentes planeados não criados)
- `scripts/schema.sql` — adicionadas definições das RPCs `get_pois_for_route` e `get_destinations` (documentação de recovery; RPCs existem na BD via migrations)

## [0.8.0] - 2026-02-25

### Adicionado
- `hooks/useDestinations.ts` — fetch destinations via `get_destinations` RPC + featured routes via FK join; `isPolygon` + `isLineString` type guards
- `components/Map/DestinationMap.tsx` — Mapbox map with amber polygon fill + dashed outline + orange featured route lines; `fitBounds` on destination change
- `components/Destinations/DestinationList.tsx` — amber left-border selection, skeleton loading, description `line-clamp-2`
- `components/Destinations/DestinationDetails.tsx` — amber header label, featured routes list with distance + landscape_type badges; mobile bottom sheet (55vh)
- `pages/DestinationsPage.tsx` — responsive orchestrator with URL slug sync (`/destinations/:slug`); floating pill + mobile list sheet
- Supabase migration `add_get_destinations_rpc` — `get_destinations()` RPC with `ST_AsGeoJSON(bounding_box)`
- `App.tsx` — routes `/destinations` + `/destinations/:slug` → `DestinationsPage`
- `MobileTabBar.tsx` — "Regions" tab (globe icon); active check uses `startsWith` for slug sub-paths

### Alterado
- `types/database.ts` — added `get_destinations` to `Functions`
- `components/Map/mapLayers.ts` — appended destination layer constants + `addDestinationSources`, `addDestinationLayers`, `updateDestinationBBoxSource`, `updateDestinationRoutesSource`

## [0.7.2] - 2026-02-25

### Adicionado
- `scripts/import_gpx.py` — suporte a `trim_south_lat` por rota: filtra pontos GPX abaixo de uma latitude, sem ficheiros adicionais
- Nova rota `n2-tras-os-montes` (88.71 km) — troço norte da N2, Chaves → Peso da Régua (lat ≥ 41.15), variante da N2 completa

### Alterado
- Journey "Volta Trás-os-Montes" — Stage 2 aponta agora para `n2-tras-os-montes` em vez da N2 completa (716 km)
- Destination "Trás-os-Montes" — featured routes actualizado para `n2-tras-os-montes` + `pt-n304-alvao`
- Validação do pipeline actualizada: 8 rotas, 2 journeys

## [0.7.1] - 2026-02-25

### Adicionado
- `components/AppShell/NavHeader.tsx` — navegação partilhada para o sidebar desktop (Moto Routes | Routes | Journeys), com active state via `useLocation`
- `components/AppShell/MobileTabBar.tsx` — tab bar fixa no fundo em mobile (md:hidden) com ícones SVG e active state

### Alterado
- `App.tsx` — `/` redireciona para `/routes` via `<Navigate replace>`; `HomePage` removida
- `pages/RoutesPage.tsx` — usa `NavHeader` + `MobileTabBar`; pill subiu para `bottom-16` (acima da tab bar)
- `pages/JourneysPage.tsx` — usa `NavHeader` + `MobileTabBar`; pill subiu para `bottom-16`

### Corrigido
- `components/Routes/RouteList.tsx` — `bg-gray-850` substituído por `bg-gray-800` (cor inexistente em Tailwind v4)
- `components/Journeys/JourneyList.tsx` — `hover:bg-gray-850` substituído por `hover:bg-gray-800`

## [0.7.0] - 2026-02-25

### Adicionado (Fase 5 — Frontend Journeys)
- `hooks/useJourneys.ts` — hook com fetch de journeys e etapas (via Supabase join `journey_stages → routes`), estado `selectedJourney`, `selectedStage`, `loadingStages`
- `components/Map/mapLayers.ts` — constantes `SOURCE_JOURNEY_STAGES`, `LAYER_JOURNEY_STAGES`, `LAYER_JOURNEY_STAGE_HOVER`, `SOURCE_JOURNEY_SELECTED`, `LAYER_JOURNEY_SELECTED`, `STAGE_COLORS`; funções `addJourneySources`, `addJourneyLayers`, `buildStagesFeatureCollection`, `updateJourneyStagesSource`, `updateJourneySelectedSource`
- `components/Map/JourneyMap.tsx` — mapa Mapbox para journeys; etapas coloridas por `stage_order` via `match` expression; fly-to + animação ao selecionar etapa; reutiliza `RouteAnimation`
- `components/Journeys/JourneyList.tsx` — lista de journeys com skeleton, badges tipo/dias, border amber ao selecionar
- `components/Journeys/JourneyDetails.tsx` — header journey, stats total km/dias, lista de etapas com dot colorido, GPX download por etapa; `JourneyDetailsMobile` como bottom sheet
- `pages/JourneysPage.tsx` — orquestrador com sidebar desktop + bottom sheet mobile; pill flutuante "Journeys (N)"
- `App.tsx` — rota `/journeys` adicionada
- `pages/HomePage.tsx` — link para `/journeys` e versão atualizada para "Phase 5 Journeys"

## [0.6.0] - 2026-02-24

### Adicionado (Fase 4 — Frontend POIs)
- `scripts/migrations` — SQL RPC `get_pois_for_route(p_route_id uuid)` via PostGIS ST_X/ST_Y para retornar coordenadas lon/lat
- `hooks/useRoutePOIs.ts` — hook que busca POIs via `supabase.rpc`, com estado `pois`, `loading`, `selectedPOI`
- `components/Map/mapLayers.ts` — constantes `SOURCE_POIS`, `LAYER_POI_CIRCLES`, `LAYER_POI_LABELS` + funções `addPOISources`, `addPOILayers`, `updatePOISource`, `buildPOIFeatureCollection`
- `components/Map/RouteMap.tsx` — props `pois` e `onPOIClick`; useEffect para sincronizar source de POIs; eventos click/hover em `LAYER_POI_CIRCLES` com `mapboxgl.Popup` inline
- `components/Routes/POIList.tsx` — novo componente com emoji por tipo, badge por association_type (laranja/amarelo/lilás), km_marker
- `components/Routes/RouteDetails.tsx` — secção "Points of Interest" com `POIList` (escondida quando sem POIs); prop `pois?: RoutePOI[]`
- `pages/RoutesPage.tsx` — integração de `useRoutePOIs`, passagem de `pois` para `RouteMap` e `RouteDetails`/`DetailsContent`
- `types/database.ts` — tipo `Functions.get_pois_for_route` adicionado ao interface `Database`

## [0.5.3] - 2026-02-24

### Corrigido
- `components/Map/RouteMap.tsx` — Padding do `fitBounds` calculado dinamicamente (`window.innerHeight * 0.5 + 20`) em vez de 320px hardcoded em mobile
- `components/Map/RouteMap.tsx` — Adicionado `maxZoom: 13` ao `fitBounds` para evitar aproximação excessiva em rotas curtas
- `components/Map/RouteMap.tsx` — Reset do mapa ao fechar detalhes via `flyTo` para overview de Portugal (`[-7.9, 41.0]`, zoom 7)
- `components/Map/RouteMap.tsx` — Nova prop `bottomPanelHeight?: number` para controlo externo do padding bottom
- `components/Map/mapLayers.ts` — Cor do hover separada da selecionada: hover usa `#fb923c` (orange-400), selected mantém `#f97316` (orange-500)
- `pages/RoutesPage.tsx` — Desktop: painel de detalhes movido para dentro da sidebar (`w-80`), deixou de ser overlay absoluto sobre o mapa
- `pages/RoutesPage.tsx` — Z-index da lista bottom sheet corrigido de `z-30` para `z-40`
- `components/Routes/RouteDetails.tsx` — Removido bloco desktop absoluto; desktop renderizado pela sidebar via `DetailsContent` exportado

## [0.5.2] - 2026-02-24

### Corrigido
- `hooks/useRoutes.ts` — Removido `computeCenter` e campo `center` do tipo `Route` (substituído por `fitBounds`)
- `components/Map/RouteMap.tsx` — Substituído `flyTo` + zoom 11 por `fitBounds` com padding adaptativo (desktop: right 420px; mobile: bottom 320px)
- `components/Map/RouteMap.tsx` — Callback `onComplete` estabilizado com `useCallback` para evitar reinício do loop RAF
- `pages/RoutesPage.tsx` — `isMobile` passado ao `RouteMap` para padding correcto do `fitBounds`

## [0.5.1] - 2026-02-24

### Corrigido
- `pages/RoutesPage.tsx` — Sidebar agora oculta em mobile por omissão (mapa ocupa 100% do ecrã)
- `pages/RoutesPage.tsx` — Botão pill flutuante "Routes (N)" visível em mobile quando lista fechada e sem rota seleccionada
- `pages/RoutesPage.tsx` — Bottom sheet `h-[55vh]` para lista de rotas em mobile com drag handle e botão de fechar
- `pages/RoutesPage.tsx` — Lista fecha automaticamente ao seleccionar uma rota em mobile
- `components/Routes/RouteDetails.tsx` — Bottom sheet de detalhe reduzido de `h-[80vh]` para `h-[50vh]`

## [0.5.0] - 2026-02-24

### Adicionado
- `hooks/useRoutes.ts` — Hook Supabase com estado (routes, selectedRoute, hoveredRouteId)
- `components/Map/mapLayers.ts` — Definição de 3 layers Mapbox (base, hover, selected)
- `components/Map/RouteMap.tsx` — Mapa Mapbox GL JS com click, hover e fly-to (1.5s)
- `components/Map/RouteAnimation.tsx` — Animação `line-dasharray` via requestAnimationFrame (1.8s)
- `components/Routes/RouteList.tsx` — Lista de rotas com skeleton loading e estados hover/selected
- `components/Routes/RouteDetails.tsx` — Painel lateral (desktop) / bottom sheet (mobile) com download GPX
- `pages/RoutesPage.tsx` — Layout orchestrador responsivo (mobile-first, 375px–1920px)
- Rota `/routes` adicionada ao React Router
- Link "Explore Routes →" na HomePage

## [0.4.0] - 2026-02-24

### Adicionado
- `scripts/import_gpx.py` — Pipeline de importação de dados GPX (~430 LOC)
  - Parsing de 7 ficheiros GPX com gpxpy
  - Cálculo de métricas: distância, elevação gain/loss, min/max
  - Análise de curvas: resample a 50m + classificação por ângulo (gentle/moderate/sharp)
  - Downsampling para tracks grandes (N2: 17k → 3k pontos) para respeitar limite REST
  - Formato EWKT `SRID=4326;...` para colunas PostGIS via PostgREST
  - Inserção idempotente: upsert em routes/journeys/destinations, check-then-upsert em POIs
  - 2 journeys com stages ordenados
  - 3 destinations com bounding boxes e featured routes
  - 5 POIs com links route-POI
  - 42+ translations (PT + EN) para routes, journeys e destinations
  - Validação automática com critérios da Fase 2
- `scripts/pyproject.toml` + `scripts/uv.lock` — UV project com ambiente virtual reprodutível
- `.env.example` — Adicionado `SUPABASE_SERVICE_KEY` com instruções

## [0.3.0] - 2026-02-24

### Adicionado
- **Frontend inicializado** — Vite 7 + React 19 + TypeScript
- `frontend/src/lib/supabase.ts` — Client Supabase tipado com `Database` types
- `frontend/src/types/database.ts` — TypeScript types gerados do schema (11 tabelas, 2 ENUMs)
- `frontend/src/components/ErrorBoundary.tsx` — Classe React com fallback UI
- `frontend/src/pages/HomePage.tsx` — Placeholder com teste de conexão Supabase ao vivo
- `frontend/.env` — Variáveis de ambiente com credenciais reais (coberto por .gitignore)
- **Dependências de produção**: `@supabase/supabase-js`, `react-router`, `mapbox-gl`, `sonner`
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (sem `tailwind.config.js`)

### Alterado
- `frontend/vite.config.ts` — Adicionado plugin `@tailwindcss/vite`
- `frontend/src/index.css` — Substituído por `@import "tailwindcss"`
- `frontend/src/App.tsx` — `BrowserRouter` + `Routes` + `Toaster` (sonner)
- `frontend/src/main.tsx` — Envolvido em `ErrorBoundary`

### Verificado
- `npm run build` passa sem erros TypeScript

---

### Adicionado
- **Skill `/commit`** - Atomic commit helper: inspecciona git state, propõe mensagem bem formada seguindo convenções do projecto, lista ficheiros staged e executa apenas após confirmação explícita do utilizador
- `.githooks/commit-msg` - Valida formato `tipo(scope): descrição` com bypass para commits automáticos
- `.githooks/pre-commit` - Detecta secrets staged (Supabase JWT, Mapbox tokens, Stripe keys, ficheiros .env)
- `.github/workflows/ci.yml` - GitHub Actions CI (typecheck + lint + build) para push/PR no main
- **CONTRIBUTING.md** - Secção "Git Hooks" com instruções de activação + tipos `ci`, `perf`, `revert` adicionados à tabela + scope obrigatório documentado

### Modificado
- scripts/schema.sql - Schema completo da BD executável (tabelas, ENUMs, índices, RLS, triggers)
- **Schema aplicado no Supabase** via MCP migrations:
  - `initial_schema` - 11 tabelas criadas (roads, routes, journeys, journey_stages, destinations, destination_featured_routes, pois, route_pois, user_favorites, user_history, translations)
  - 2 ENUMs: `landscape_type`, `poi_association_type`
  - Índices GIST espaciais para PostGIS
  - RLS policies para todas as tabelas
  - Triggers de `updated_at` automáticos
  - `fix_function_search_path` - Correcção de segurança (search_path fixo)

### Consolidado
- **docs/SETUP.md** - Unificado com SETUP-SUPABASE.md:
  - Adicionada secção "MCP Configuration" (criar .mcp.json, autenticar, testar)
  - Adicionada secção "MCP Commands Reference" (tabela de comandos + exemplos)
  - Adicionados troubleshooting items para MCP
  - Adicionado project reference real ao topo do ficheiro
  - Removido docs/SETUP-SUPABASE.md (eliminado)

### Melhorado
- **docs/ROADMAP.md** - 5 correções para prevenir problemas futuros:
  1. Phase 2: Detalhado import script com subtasks (landscape_type, translations)
  2. Phase 3: Validation criteria específicas e mensuráveis (desktop/mobile, performance)
  3. Phase 5: Documentada estratégia de merge GPX (PostGIS ou Python)
  4. Dependencies: Diagrama actualizado com dependências implícitas visíveis
  5. Phase 1 + 10: Adicionadas tasks faltantes (error handling, tests, accessibility)
- .env.example - Template de variáveis de ambiente
- Auditoria completa de documentação, skills e agents
- LICENSE - MIT License
- **Novo agente `python-pipeline`** - Especialista em scripts Python para importação GPX
- Secção "Recommended Reading Order" em docs/INDEX.md
- **Plugin `frontend-design`** - Instalado para criar interfaces distintivas
- **Novo agente `map-specialist`** - Especialista em Mapbox GL JS (animações, layers, markers)
- **Novo agente `i18n-helper`** - Especialista em internacionalização PT/EN
- Guia de Selecção de Agentes em CLAUDE.md
- Tabela de alinhamento Agentes ↔ Roadmap

### Corrigido
- **Análise de documentação para 100%** - 3 inconsistências corrigidas:
  - CLAUDE.md: Contagem de documentos corrigida (13 → 12 ficheiros)
  - PROGRESS.md: Métrica de documentos corrigida (13 → 12)
  - docs/ROADMAP.md: Skills/subagents actualizados (7→8 skills, 10→13 subagents)
- Padronizado frontmatter YAML em 5 skills (adicionado `name:` a phase, docs, mapbox-rules, supabase-rules, schema)
- Adicionada ferramenta `Write` aos agentes code-reviewer e bug-hunter
- Actualizada lista de subagents em PROGRESS.md (10 → 11, adicionado python-pipeline)
- docs/ROADMAP.md: Adicionada tabela `roads` à lista "Database Tables" da Fase 1
- docs/SCHEMA.md: Adicionado `plains` ao ENUM `landscape_type` (alinhado com schema.sql)
- **Auditoria pré-Fase 1** - 7 inconsistências corrigidas:
  - docs/COMMANDS.md: Paths GPX corrigidos (`data/portugal/` → `data/pt/`)
  - docs/COMMANDS.md: Link quebrado corrigido (`claude-code-army.md` → `CLAUDE.md`)
  - docs/DATA.md: Landscape type corrigido (`coastal` → `coast`)
  - CLAUDE.md: Adicionado SETUP-SUPABASE.md à estrutura de documentos
  - PROGRESS.md: Contagem de skills corrigida (9 → 8)
  - docs/TROUBLESHOOTING.md: Referência a skill auto-load clarificada

### Reorganizado
- **Sistema de Agentes** reorganizado em 3 camadas: Análise → Implementação → Validação
- **`react-builder`** agora foca em lógica React (hooks, services), delega UI visual
- **`ui-designer`** transformado em "Design System Guardian" (valida consistência, não cria)
- **claude-code-army.md** actualizado com árvore de decisão de agentes
- **docs/COMMANDS.md** documentação de skills do Claude Code

### Alterado
- **Convenção de nomes GPX**: Nova convenção `{país}-{código}[-{tipo}-{nome}].gpx`
  - Renomeados todos os ficheiros GPX (ex: N222.gpx → pt-n222.gpx)
  - Directórios: portugal/ → pt/, spain/ → es/
  - Actualizado docs/DATA.md com nova convenção
- **Documentação traduzida para EN**:
  - docs/ARCHITECTURE.md
  - docs/DECISIONS.md
  - docs/TROUBLESHOOTING.md
- **Skills corrigidas**:
  - Removidas referências a MVP.md inexistente
  - Consolidadas regras de coordenadas em coordinate-rules
  - Adicionado auto_invoke a /schema skill
- **Agents actualizados**:
  - gpx-analyst: paths actualizados (data/pt/, data/es/)
  - db-helper: referência corrigida para docs/SCHEMA.md
  - ux-designer: adicionadas ferramentas Write e Edit
- **Schema corrigido**:
  - Adicionado 'plains' ao ENUM landscape_type
- **Documentação corrigida**:
  - docs/ROADMAP.md: landscape types alinhados com schema.sql
  - docs/SETUP.md: instruções para inicializar Vite
  - docs/SCHEMA.md: adicionado suggested_days em journeys, documentados índices lookup

### Removido
- Duplicação de regras de coordenadas em mapbox-rules, supabase-rules, gpx-analyst, code-reviewer

---

## [0.2.1] - 2026-01-26

### Adicionado
- Extensão PostGIS instalada no Supabase (v3.3.7) via migração
- docs/SETUP-SUPABASE.md - Guia detalhado de configuração Supabase
- Skill `/docs` para navegação de documentação
- Secção "Onde Encontrar Informação" em CLAUDE.md

### Alterado
- Skills `/status` e `/phase` actualizadas para usar docs/ROADMAP.md
- docs/DECISIONS.md expandido com funcionalidades incluídas/excluídas
- docs/ROADMAP.md expandido com checklist de verificação final

### Removido
- docs/archive/MVP_ORIGINAL.md eliminado (informação migrada)
- Secção "Archive" removida de docs/INDEX.md

---

## [0.2.0] - 2026-01-26

### Adicionado

**Documentação Reorganizada (docs/):**
- INDEX.md - Mapa de navegação da documentação
- VISION.md - Filosofia e objectivos do projecto
- ROADMAP.md - 10 fases de implementação com critérios
- SCHEMA.md - Schema completo da BD com ERD
- STACK.md - Stack tecnológica com justificações
- SETUP.md - Guia de configuração do ambiente
- DATA.md - Catálogo de dados GPX disponíveis
- PATTERNS.md - Padrões e anti-padrões (lições aprendidas)
- COMMANDS.md - Referência rápida de comandos

**Raiz:**
- README.md - Entry point profissional para GitHub
- CONTRIBUTING.md - Guia de contribuição

**Estrutura:**
- docs/archive/ - Pasta para documentos históricos

### Alterado
- ARCHITECTURE.md movido para docs/
- DECISIONS.md movido para docs/
- TROUBLESHOOTING.md movido para docs/
- CLAUDE.md actualizado com novos links
- CONTEXT.md actualizado com novos links
- PROGRESS.md actualizado com novos links

### Arquivado
- MVP.md → docs/archive/MVP_ORIGINAL.md (referência histórica)

---

## [0.1.0] - 2026-01-26

### Adicionado

**Documentação:**
- MVP.md - Plano completo do projeto (25KB)
- CLAUDE.md - Regras de desenvolvimento
- ARCHITECTURE.md - Arquitetura do sistema
- DECISIONS.md - 7 ADRs documentados
- PROGRESS.md - Estado atual do projeto
- TROUBLESHOOTING.md - Problemas comuns
- CONTEXT.md - Resumo rápido para início de sessão

**Dados:**
- 7 ficheiros GPX prontos para importar:
  - N2.gpx (739km)
  - N222.gpx + 3 variantes
  - N304-alvao.gpx (36km)
  - Figueres-Cadaques.gpx (~60km)

**Claude Code Skills (7):**
- `/status` - Estado do projeto
- `/next` - Próxima tarefa
- `/phase` - Critérios da fase atual
- `/schema` - Schema da BD
- `coordinate-rules` (auto) - Regras de coordenadas
- `mapbox-rules` (auto) - Padrões Mapbox GL JS
- `supabase-rules` (auto) - Padrões Supabase/PostGIS

**Claude Code Subagents (10):**
- `gpx-analyst` - Análise de ficheiros GPX
- `react-builder` - Criação de componentes React
- `db-helper` - Queries PostGIS e migrations
- `code-reviewer` - Revisão de código
- `doc-writer` - Documentação
- `test-writer` - Testes unitários e integração
- `bug-hunter` - Investigação de bugs
- `refactorer` - Refactoring de código
- `ux-designer` - Design de UX
- `ui-designer` - Design de UI/Tailwind

**Configuração:**
- .mcp.json - MCPs Supabase e Context7
- .gitignore - Ignora ficheiros sensíveis
- Git inicializado com commit inicial

### Alterado
- Limpeza de referências a versões anteriores
- Documentação usa termos correctos
- Caminhos actualizados para estrutura autónoma

### Removido
- Referências a ficheiros externos
- Links para pasta pai inexistente

---

## Formato de Versões Futuras

### [X.Y.Z] - YYYY-MM-DD

#### Adicionado
- Novas funcionalidades

#### Alterado
- Mudanças em funcionalidades existentes

#### Corrigido
- Bugs resolvidos

#### Removido
- Funcionalidades removidas

#### Segurança
- Vulnerabilidades corrigidas
