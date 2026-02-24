# Progresso do Projeto

> Actualizar este ficheiro sempre que uma tarefa é concluída.

## Fase Atual: 3 - Frontend Routes (próxima)

### Phase 2 ✓ COMPLETA (2026-02-24)
- [x] `scripts/import_gpx.py` — pipeline GPX completo (390 LOC)
- [x] 7 rotas inseridas com métricas + geometria PostGIS
- [x] 2 journeys com stages ordenados
- [x] 3 destinations com bounding boxes
- [x] 5 POIs com links às rotas
- [x] 48 translations PT + EN
- [x] Validação automática: todos os critérios passados
- [x] Frontend confirma: "Connected — 7 routes in database"

---

## Phase 1 ✓ COMPLETA
## Phase 0 ✓ COMPLETA - Preparação

### Concluído
- [x] Estrutura de pastas criada
- [x] Documentação base reorganizada profissionalmente
- [x] Limpeza de referências antigas
- [x] Ficheiros GPX copiados para `data/`
- [x] Sistema de skills Claude Code (5 user + 3 auto = 8 skills)
- [x] Sistema de subagents Claude Code (13 subagents)
- [x] Configuração de MCPs (Supabase, Context7)
- [x] CONTEXT.md para orientação rápida
- [x] Git inicializado

### Documentação Reorganizada

**docs/ (12 documentos):**
- INDEX.md - Mapa de navegação
- VISION.md - Filosofia e objectivos
- ROADMAP.md - 10 fases de implementação
- ARCHITECTURE.md - Design do sistema
- SCHEMA.md - Schema completo da BD
- STACK.md - Stack tecnológica
- SETUP.md - Configuração do ambiente (inclui MCP e Supabase)
- DATA.md - Catálogo de dados GPX
- PATTERNS.md - Boas práticas
- COMMANDS.md - Referência de comandos
- DECISIONS.md - ADRs
- TROUBLESHOOTING.md - Problemas comuns

**Raiz:**
- README.md - Entry point profissional
- CONTRIBUTING.md - Guia de contribuição

### Sistema Claude Code Instalado

**Skills (8):**
- `/status` - Estado do projeto
- `/next` - Próxima tarefa
- `/phase` - Critérios da fase
- `/schema` - Schema da BD
- `/docs` - Mapa de documentação
- `coordinate-rules` (auto) - Regras de coordenadas
- `mapbox-rules` (auto) - Padrões Mapbox
- `supabase-rules` (auto) - Padrões Supabase

**Subagents (13):**

*Análise:*
- `ux-designer` - Fluxos, wireframes, UX

*Implementação:*
- `frontend-design` - UI visual distintiva (plugin)
- `react-builder` - Lógica React, hooks, services
- `map-specialist` - Mapbox GL JS, animações, layers
- `i18n-helper` - Internacionalização PT/EN
- `db-helper` - Queries PostGIS, migrations
- `python-pipeline` - Pipeline Python para dados

*Validação:*
- `ui-designer` - Consistência design system
- `code-reviewer` - Revisão de código
- `test-writer` - Testes

*Especialistas:*
- `gpx-analyst` - Análise de GPX
- `doc-writer` - Documentação
- `bug-hunter` - Debugging
- `refactorer` - Refactoring

---

## Fase Atual: 2 - Pipeline de Dados (Pendente)

---

## Fase 1 - Fundação ✓ COMPLETA

### Concluído
- [x] Criar projeto Supabase (epaxdcbvbysjrnwuffay)
- [x] Configurar MCP Supabase para Claude Code
- [x] Instalar extensão PostGIS (v3.3.7)
- [x] Documentar setup (docs/SETUP.md - consolidado)
- [x] Criar scripts/schema.sql completo
- [x] Criar .env.example
- [x] Auditoria completa da documentação
- [x] Renomear ficheiros GPX (nova convenção: pt-n222.gpx)
- [x] Traduzir docs técnicos para EN
- [x] Verificação pré-implementação (auditoria crítica)
- [x] Corrigir landscape_type ENUM (adicionado 'plains')
- [x] Criar ficheiro LICENSE (MIT)
- [x] Criar agente python-pipeline
- [x] Actualizar ux-designer com Write/Edit
- [x] Documentar índices lookup em SCHEMA.md
- [x] Corrigir SETUP.md com instruções Vite
- [x] Adicionar suggested_days a SCHEMA.md journeys
- [x] Instalar plugin frontend-design
- [x] Criar agente map-specialist
- [x] Criar agente i18n-helper
- [x] Reorganizar sistema de agentes (3 camadas: Análise/Implementação/Validação)
- [x] Actualizar react-builder (foco em lógica, delega UI)
- [x] Actualizar ui-designer (design system guardian)

### Concluído (continuação)
- [x] Executar schema.sql no Supabase ✓
- [x] Inicializar frontend com Vite 7 + React 19 + TypeScript
- [x] Configurar Tailwind CSS v4 (via @tailwindcss/vite plugin)
- [x] Configurar variáveis de ambiente (.env com credenciais reais)
- [x] Definir error handling pattern (ErrorBoundary + Sonner toasts)
- [x] Criar supabase client tipado (Database types gerados do schema)
- [x] Criar HomePage com teste de conexão Supabase
- [x] `npm run build` passa sem erros

### Pendente
- (nenhum — Fase 1 completa)

Ver critérios completos em [docs/ROADMAP.md](./docs/ROADMAP.md)

---

## Métricas

| Métrica | Atual | Meta |
|---------|-------|------|
| Rotas importadas | 0 | 7 |
| Journeys criados | 0 | 2 |
| Destinations | 0 | 3 |
| POIs | 0 | 10 |
| Componentes React | 0 | ~25 |
| Skills Claude Code | 8 | 8 |
| Subagents Claude Code | 13 | 13 |
| Documentos docs/ | 12 | 12 |

---

## Histórico de Fases

| Fase | Nome | Estado | Data Início | Data Fim |
|------|------|--------|-------------|----------|
| 0 | Preparação | ✓ Completa | 2026-01-26 | 2026-01-26 |
| 1 | Fundação | ✓ Completa | 2026-01-26 | 2026-02-24 |
| 2 | Pipeline de Dados | Pendente | - | - |
| 3 | Frontend - Routes | Pendente | - | - |
| 4 | Frontend - POIs | Pendente | - | - |
| 5 | Frontend - Journeys | Pendente | - | - |
| 6 | Frontend - Destinations | Pendente | - | - |
| 7 | Frontend - Users | Pendente | - | - |
| 8 | Multilingue | Pendente | - | - |
| 9 | Tags Paisagem | Pendente | - | - |
| 10 | Polish & Deploy | Pendente | - | - |

---

## Última Actualização
2026-02-24 (Fase 1 completa: frontend Vite+React+TS inicializado, Tailwind v4, Supabase client tipado, build sem erros)
