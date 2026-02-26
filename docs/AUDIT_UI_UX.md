# Auditoria UI/UX — Moto Routes v4

> Auditoria realizada em 2026-02-25. Todas as páginas e componentes testados em desktop (1440×900) e mobile (375×812). Inclui análise de código estático por agentes especializados e testes manuais no browser.

---

## Páginas Testadas

- `/routes` — RoutesPage (lista + mapa + details + POIs + auth)
- `/journeys` — JourneysPage (lista + mapa + stages + download)
- `/destinations` — DestinationsPage (lista + mapa + polygon)
- `/profile` — ProfilePage (tabs Favourites/History)
- Auth flows (LoginModal, UserMenu)
- NavHeader (links, auth area)
- MobileTabBar (4 tabs)
- Mobile bottom sheets (55vh)

---

## 🔴 CRÍTICO — Funcionalmente Quebrado

### 1. NavHeader: link "Regions" inacessível / "Sign in" sobreposto

**Componente**: `frontend/src/components/AppShell/NavHeader.tsx`
**Afecta**: Todas as páginas desktop

O sidebar tem `w-80` (320px). O NavHeader contém "Moto Routes | Routes Journeys Regions" + botão "Sign in", que no total necessita ~352px. O `flex-shrink-0` no botão "Sign in" faz com que este flutue por cima do link "Regions".

**Efeitos observados** (confirmados em browser):
- Em `/routes`: "Sign in" sobrepõe visualmente o texto "Regions"
- Em `/destinations`: "Sign in" desaparece completamente (empurrado para fora do viewport)
- Clicar em "Regions" no NavHeader abre o LoginModal em vez de navegar para `/destinations` ✅ *confirmado*

**Causa raiz**: `w-80` (320px) insuficiente para o conteúdo do header (~352px).

**Soluções possíveis**:
```
A) Aumentar sidebar: w-80 → w-88 (352px) ou w-96 (384px)
B) Reduzir padding/gap: px-4 → px-2, gap-3 → gap-2
C) Encurtar "Moto Routes" para logo/ícone
```

---

### 2. LoginModal: sem focus trap

**Componente**: `frontend/src/components/Auth/LoginModal.tsx:47-50`
**Afecta**: Todas as páginas onde o modal é aberto

Com o modal aberto, o utilizador pode usar Tab para navegar fora do modal para o conteúdo de fundo. Viola WCAG 2.1 AA (Success Criterion 2.1.2 No Keyboard Trap — ironia: o problema é a ausência de trap).

**Fix**: Usar biblioteca `focus-trap-react` ou implementar manualmente um focus trap no `useEffect` do modal.

---

## 🟠 ALTO — Problemas de Usabilidade

### 3. Mobile: conteúdo final das bottom sheets oculto pela MobileTabBar

**Componentes**:
- `frontend/src/components/Routes/RouteDetails.tsx:62`
- `frontend/src/components/Journeys/JourneyDetails.tsx:222`
- `frontend/src/components/Destinations/DestinationDetails.tsx:104`

**Afecta**: Todas as páginas em viewport mobile

Todos os bottom sheets usam `fixed bottom-0 z-20`. A `MobileTabBar` usa `fixed bottom-0 z-50`. Os últimos ~60px de conteúdo scrollável ficam inacessíveis por baixo do tab bar:
- Em Routes: botão "Download GPX" não clicável ✅ *confirmado em browser*
- Em Journeys: Stage 3 ("Extensão Pias") parcialmente oculto
- Em Destinations: último item de featured routes cortado

**Fix**: adicionar `pb-16` ao container scrollável em cada ficheiro:
```tsx
// RouteDetails.tsx linha 62
"md:hidden fixed bottom-0 left-0 right-0 h-[55vh] ... overflow-y-auto z-20 pb-16"

// JourneyDetails.tsx linha 222
"... pb-16"

// DestinationDetails.tsx linha 104
"... pb-16"
```

---

### 4. ProfilePage: redirect silencioso sem feedback ao utilizador

**Componente**: `frontend/src/pages/ProfilePage.tsx:75-78`
**Afecta**: `/profile` sem autenticação (desktop e mobile)

```tsx
if (!authLoading && !user) {
  navigate('/routes', { replace: true })
  return null  // ← sem toast, sem mensagem
}
```

O utilizador clica em "Profile" e é redireccionado para `/routes` sem qualquer explicação. Em mobile é especialmente confuso: a tab bar mostra "Profile" activo por um instante antes de voltar para "Routes". ✅ *confirmado em browser*

**Fix**:
```tsx
import { toast } from 'sonner'
// ...
if (!authLoading && !user) {
  toast.info('Sign in to view your profile')
  navigate('/routes', { replace: true })
  return null
}
```

---

### 5. Mobile: nenhuma forma de fazer Sign In excepto pelo FavoriteButton

**Componente**: `frontend/src/components/AppShell/MobileTabBar.tsx`
**Afecta**: Toda a app em mobile (utilizadores não autenticados)

O `NavHeader` é `hidden` em mobile (`hidden md:flex`). O único trigger para o LoginModal em mobile é clicar no FavoriteButton numa rota — não há nenhum CTA de Sign In visível para utilizadores não autenticados. ✅ *confirmado em browser*

**Fix sugerido**: No tab "Profile" da `MobileTabBar`, quando o utilizador não está autenticado, abrir directamente o `LoginModal` em vez de navegar para `/profile` (que faz redirect silencioso).

---

### 6. LoginModal: dialog sem role semântico e close button sem aria-label

**Componente**: `frontend/src/components/Auth/LoginModal.tsx:57-68`
**Afecta**: Todos os utilizadores de tecnologias assistivas

- Overlay do dialog sem `role="dialog"` e `aria-labelledby` — leitores de ecrã não anunciam o modal como dialog
- Botão de fecho (×) sem `aria-label` — anunciado como "button" sem contexto
- Mensagem de erro (linha 118-122) não associada ao form via `aria-describedby`
- Input fields sem `id` para associação com `<label>` (apenas placeholder)

**Fix**:
```tsx
<div role="dialog" aria-modal="true" aria-labelledby="login-title">
  ...
  <button aria-label="Close sign in dialog">×</button>
  ...
  <h2 id="login-title">Sign in</h2>
  ...
  <div role="alert" aria-live="assertive">{error}</div>
```

---

### 7. UserMenu: sem roles semânticos e sem navegação por teclado

**Componente**: `frontend/src/components/Auth/UserMenu.tsx:34-79`
**Afecta**: Utilizadores autenticados com teclado/screen reader

- Container sem `role="menu"` e botões sem `role="menuitem"`
- Botão toggle sem `aria-haspopup="menu"` e `aria-expanded`
- Sem navegação por teclas de seta (arrow keys)
- Click-outside usa `mousedown` — não funciona para utilizadores de teclado (Tab)
- Avatar sem fallback se `avatarUrl` estiver quebrado

---

### 8. RoutesPage: bottomPanelHeight usa 50vh mas sheet real é 55vh

**Componente**: `frontend/src/pages/RoutesPage.tsx:152`
**Afecta**: Layout do mapa em mobile

`bottomPanelHeight={isMobile ? window.innerHeight * 0.5 : undefined}` — 50% do viewport, mas o bottom sheet usa `h-[55vh]`. O mapa não centra correctamente as rotas quando a sheet está aberta.

Adicionalmente: `window.innerHeight` é lido no render sem listener de resize — não se actualiza em rotação de dispositivo.

**Fix**: Usar `window.innerHeight * 0.55` e adicionar `ResizeObserver` ou listener de `resize`.

---

### 9. JourneysPage / DestinationsPage: erro mostrado na sidebar mas não na mobile sheet

**Componentes**:
- `frontend/src/pages/JourneysPage.tsx:190-193`
- `frontend/src/pages/DestinationsPage.tsx:180-181`

Em caso de erro de fetch, a mensagem de erro é renderizada na sidebar desktop (linha 115 / 99) mas **não** na mobile bottom sheet. Em mobile, o utilizador abre a sheet e vê conteúdo vazio sem qualquer indicação do erro.

---

## 🟡 MÉDIO — Inconsistências Visuais

### 10. POI popup com estilo claro (branco) incompatível com dark theme

**Componente**: `frontend/src/components/Map/RouteMap.tsx` (instância de `mapboxgl.Popup`)
**Afecta**: `/routes` ao clicar num POI no mapa

O popup usa o estilo Mapbox default (fundo branco, texto preto), enquanto toda a app usa dark theme (`bg-gray-950`). ✅ *confirmado em browser*

**Fix**:
```tsx
// Em RouteMap.tsx, ao criar o Popup
new mapboxgl.Popup({ className: 'poi-popup', closeButton: false })

// Em index.css (ou equivalente)
.poi-popup .mapboxgl-popup-content {
  background: #111827;
  color: white;
  border: 1px solid #1f2937;
  border-radius: 0.5rem;
  padding: 0.75rem;
}
.poi-popup .mapboxgl-popup-tip {
  border-top-color: #111827;
}
```

---

### 11. Botão "Download merged GPX" faz text wrap em 2 linhas no desktop

**Componente**: `frontend/src/components/Journeys/JourneyDetails.tsx`
**Afecta**: `/journeys` → sidebar desktop (320px de largura)

"Download merged GPX (240 km)" é demasiado longo para o botão a 320px, resultando em quebra de linha no meio de "km)". ✅ *confirmado em browser*

**Fix**: encurtar o label ou usar `whitespace-nowrap`:
```tsx
// Opção A — encurtar
`Download GPX (${totalKm} km)`

// Opção B — forçar nowrap
className="... whitespace-nowrap"
```

---

### 12. Focus ring azul (browser default) no FavoriteButton após fechar modal com ESC

**Componente**: `frontend/src/components/Routes/FavoriteButton.tsx`
**Afecta**: `/routes` → details sidebar

Ao fechar o LoginModal com ESC, o foco volta para o FavoriteButton que mostra o browser focus ring azul. Inconsistente com o design system (laranja/orange-500). ✅ *confirmado em browser*

**Fix**:
```tsx
className="... focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-950"
```

---

### 13. FavoriteButton: touch target abaixo do mínimo WCAG (27px vs 44px)

**Componente**: `frontend/src/components/Routes/FavoriteButton.tsx:30`
**Afecta**: Utilizadores mobile e de acessibilidade

O botão usa `p-1.5` sem dimensões fixas, resultando em ~27×27px — abaixo do mínimo de 44×44px recomendado pela WCAG 2.1 (Success Criterion 2.5.5).

**Fix**: `className="... min-w-[44px] min-h-[44px]"`

---

### 14. ProfilePage tabs sem ARIA roles (tablist/tab/tabpanel)

**Componente**: `frontend/src/pages/ProfilePage.tsx:94-156`

Tabs de Favourites/History não têm `role="tablist"`, `role="tab"`, `aria-selected`, `role="tabpanel"`, ou `aria-labelledby`. Screen readers não conseguem navegar o padrão de tabs correctamente.

---

### 15. DestinationList: sem estado vazio e border jump no hover

**Componente**: `frontend/src/components/Destinations/DestinationList.tsx:39-48`

- Sem fallback quando `destinations.length === 0` e não está a carregar
- Hover aplica `border-gray-600` a um elemento que tinha `border-transparent` — cria "salto" visual de 1px que desloca o conteúdo

**Fix border jump**: Usar `border-gray-800` como default em vez de `border-transparent`.

---

### 16. JourneyDetails: sem estado de erro nas stages

**Componente**: `frontend/src/components/Journeys/JourneyDetails.tsx:64`

Se o fetch das stages falhar, o componente mostra skeleton indefinidamente (ou conteúdo vazio). O erro do hook não é propagado para o componente.

---

### 17. Botão GPX sem loading state (Desktop e Mobile)

**Componente**: `frontend/src/components/Routes/RouteDetails.tsx:160-177`

O botão "Download GPX" não tem estado de loading — se o download demorar (ficheiro grande), o utilizador não recebe feedback visual.

---

## 🔵 BAIXO — Melhorias Opcionais

### 18. URL slug inválido: sem feedback de "not found"

**Afecta**: `/routes/slug-inexistente`, `/journeys/slug-inexistente`, `/destinations/slug-inexistente`

Mostra a lista normal sem indicação de que o slug não existe. ✅ *confirmado em browser*

**Fix sugerido**: toast "Route not found" antes de deseleccionar.

---

### 19. Polígono da região não claramente visível no mapa

**Componente**: `frontend/src/components/Map/DestinationMap.tsx`
**Afecta**: `/destinations` → detalhe de uma região

Ao seleccionar uma destination, as featured routes aparecem em laranja no mapa mas o polígono/bounding box da região (fill amber + dashed outline) não é claramente visível. ✅ *confirmado em browser — polígono invisível*

**A investigar**: verificar se `bounding_box_geojson` está a ser retornado correctamente pela RPC e se o layer está a ser adicionado ao mapa. Opacidade actual 0.08 pode ser demasiado baixa.

---

### 20. MobileTabBar: SVG icons sem aria-hidden

**Componente**: `frontend/src/components/AppShell/MobileTabBar.tsx:53-66`

Ícones SVG não têm `aria-hidden="true"`. Screen readers anunciam tanto o ícone como o texto do tab, resultando em leitura duplicada.

---

### 21. Floating pill button sem aria-label

**Componente**: `frontend/src/pages/RoutesPage.tsx:173-179`

O botão pill "Routes (8)" / "Journeys (2)" em mobile não tem `aria-label`. Screen readers anunciam apenas o texto, sem contexto de que é um botão de abertura de lista.

---

### 22. Google login sem estado de loading

**Componente**: `frontend/src/components/Auth/LoginModal.tsx:79-90`

Ao clicar "Continue with Google", não há spinner nem disable do botão enquanto o OAuth redireccionamento está a acontecer. Utilizador pode clicar múltiplas vezes.

---

---

## 📱 TABLET — Problemas de Responsividade (768px–1024px)

> Testado em browser: portrait 768×1024 e landscape 1024×768. Análise de código por agentes especializados.

### T1. Sidebar activa a 768px deixa mapa com apenas 448px — ALTO

**Afecta**: `/routes`, `/journeys`, `/destinations` em tablet portrait

O breakpoint `md:` (768px) activa o sidebar de `w-80` (320px). Em tablet portrait (768×1024), a divisão é:
- Sidebar: 320px → **41.7% do viewport** ✅ *confirmado em browser*
- Mapa: **448px restantes** — muito estreito para Mapbox + controlos de zoom

Em landscape 1024×768, a divisão é mais aceitável (704px para mapa).

```
Portrait 768px:  [──320px sidebar──][──448px mapa──]  ← problemático
Landscape 1024px: [──320px sidebar──][──704px mapa──]  ← aceitável
```

**Causa raiz**: `md:flex md:w-80` em todos os Pages activa a 768px em vez de 1024px (`lg:`).

**Fix recomendado**: Mover o breakpoint do sidebar de `md:` para `lg:` (1024px):
```tsx
// RoutesPage.tsx, JourneysPage.tsx, DestinationsPage.tsx
// Antes:  hidden md:flex md:w-80
// Depois: hidden lg:flex lg:w-80
// Também: md:hidden → lg:hidden nos mobile bottom sheets
```
Isto manteria tablets portrait (768–1023px) com o layout mobile (full-width mapa + bottom sheet).

---

### T2. Salto de layout abrupto em 767→768px — ALTO

**Afecta**: Todos os tablets na fronteira do breakpoint ✅ *confirmado em browser*

Em 767px: layout mobile completo (mapa full-width + MobileTabBar + pill button).
Em 768px: layout desktop imediato (sidebar 320px + sem tab bar + sem pill).

Não há transição gradual. Um utilizador a redimensionar a janela ou a rodar o tablet vê uma mudança brusca de layout.

---

### T3. `fitBounds` não considera a sidebar no cálculo de padding — MÉDIO

**Componente**: `frontend/src/components/Map/RouteMap.tsx:275-278`
**Afecta**: Centramento de rotas em tablet

O padding usado para `fitBounds` em desktop é `{ top: 60, bottom: 60, left: 60, right: 60 }`. Em tablet portrait com 448px de mapa, os 60px de padding lateral reduzem a área efectiva a apenas **328px** — as rotas ficam mal centradas ou com zoom incorrecto.

---

### T4. Grid de stats (2 colunas) espremido em 280px de largura útil — MÉDIO

**Componentes**:
- `frontend/src/components/Routes/RouteDetails.tsx:132`
- `frontend/src/components/Journeys/JourneyDetails.tsx:117`

O sidebar tem 320px, mas com `p-6` (24px cada lado), a largura útil do conteúdo é **~272px**. O grid `grid-cols-2 gap-2` resulta em caixas de stats com ~132px cada — muito apertado para valores como "13378 m" ou "ELEVATION GAIN".

---

### T5. Stage items e route cards com padding não adaptado a tablet — MÉDIO

**Componentes**:
- `frontend/src/components/Journeys/JourneyDetails.tsx:163` — stage items com `flex gap-3`: nome + dot color + download button num espaço de 272px
- `frontend/src/components/Routes/RouteList.tsx:93` — stats row com `gap-4` pode quebrar para 2 linhas

Em tablet portrait, a largura disponível no sidebar é idêntica a qualquer outro viewport desktop, mas a experiência visual é pior porque o mapa fica "espremido" do outro lado.

---

### T6. POI popup com `maxWidth: 260px` pode sair do mapa em tablet — BAIXO

**Componente**: `frontend/src/components/Map/RouteMap.tsx:202`

Com o mapa a 448px, um popup de 260px ocupa 58% da largura do mapa. Se o POI estiver próximo da borda, o popup pode ser cortado ou empurrar o mapa.

---

### T7. Title "N222 — Vale do Douro" faz wrap para 2 linhas em tablet — BAIXO

**Componente**: `frontend/src/components/Routes/RouteDetails.tsx:81`
**Afecta**: Sidebar em tablet portrait ✅ *confirmado em browser*

`text-xl leading-tight` em 272px de largura útil faz com que nomes de rota longos quebrem para 2 linhas, consumindo mais espaço no sidebar já limitado.

---

## Resumo Executivo

| Severidade | Problemas | Ficheiros Principais Afectados |
|------------|-----------|-------------------------------|
| 🔴 Crítico | 2 | `NavHeader.tsx`, `LoginModal.tsx` |
| 🟠 Alto | 9 | `RouteDetails.tsx`, `JourneyDetails.tsx`, `DestinationDetails.tsx`, `ProfilePage.tsx`, `MobileTabBar.tsx`, `LoginModal.tsx`, `UserMenu.tsx`, `RoutesPage.tsx`, `JourneysPage.tsx` |
| 🟡 Médio | 10 | `RouteMap.tsx`, `JourneyDetails.tsx`, `FavoriteButton.tsx`, `ProfilePage.tsx`, `DestinationList.tsx` |
| 🔵 Baixo | 8 | `MobileTabBar.tsx`, `RoutesPage.tsx`, `LoginModal.tsx`, `RouteMap.tsx` |
| 📱 Tablet | 7 | `RoutesPage.tsx`, `JourneysPage.tsx`, `DestinationsPage.tsx`, `RouteMap.tsx`, `RouteDetails.tsx` |

---

## Quick Wins (por ordem de impacto/esforço)

| Prioridade | Fix | Esforço |
|------------|-----|---------|
| 1 | `pb-16` nos 3 bottom sheets (mobile) | 3 linhas |
| 2 | `toast.info()` no ProfilePage redirect | 2 linhas |
| 3 | NavHeader overlap (aumentar sidebar ou reduzir padding) | CSS |
| 4 | Encurtar texto do botão GPX merged (`whitespace-nowrap`) | 1 linha |
| 5 | `focus-visible:ring-orange-500` no FavoriteButton | 1 linha |
| 6 | `min-w-[44px] min-h-[44px]` no FavoriteButton | 1 linha |
| 7 | POI popup dark theme | CSS custom |
| 8 | Profile tab → abrir LoginModal em mobile (não redirect) | ~10 linhas |
| 9 | `aria-label` no close button do LoginModal | 1 linha |
| 10 | `aria-hidden="true"` nos SVG icons do MobileTabBar | 4 linhas |
| 11 | Google login: disable button + spinner durante OAuth | ~5 linhas |
| 12 | `bottomPanelHeight` fix: 0.50 → 0.55 | 1 linha |
| 13 | **[TABLET]** Mover sidebar de `md:` para `lg:` (768→1024px) | ~6 linhas em 3 ficheiros |
| 14 | Focus trap no LoginModal | ~20 linhas |
| 15 | `role="dialog"` + ARIA no LoginModal | ~5 linhas |
| 16 | ProfilePage tabs: `role="tablist/tab/tabpanel"` | ~10 linhas |
| 17 | **[TABLET]** `fitBounds` padding ajustado para sidebar width | ~5 linhas |
