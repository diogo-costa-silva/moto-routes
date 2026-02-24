# Changelog

Todas as mudanças notáveis neste projecto serão documentadas neste ficheiro.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Unreleased]

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
