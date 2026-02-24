---
name: docs
description: Mostra o mapa de documentação do projecto Moto Routes e sugere qual documento ler
user_invocable: true
allowed_tools:
  - Read
---

# Skill: /docs

## Objectivo
Mostrar o mapa de documentação do projecto e sugerir qual documento é relevante para o contexto actual.

## Instruções

1. **Ler docs/INDEX.md** para obter o mapa completo de documentação

2. **Apresentar de forma estruturada**:

```
## Documentação do Projecto Moto Routes

### Para Começar
- README.md - Visão geral do projecto
- docs/SETUP.md - Configuração do ambiente
- docs/COMMANDS.md - Comandos de referência

### Entender o Projecto
- docs/VISION.md - Filosofia e objectivos
- docs/ARCHITECTURE.md - Design do sistema
- docs/STACK.md - Tecnologias utilizadas

### Implementação
- docs/ROADMAP.md - Fases de implementação
- docs/SCHEMA.md - Schema da base de dados
- docs/DATA.md - Dados GPX disponíveis
- docs/PATTERNS.md - Boas práticas

### Estado e Decisões
- PROGRESS.md - Estado actual
- CHANGELOG.md - Histórico de mudanças
- docs/DECISIONS.md - Decisões de arquitectura

### Problemas
- docs/TROUBLESHOOTING.md - Problemas comuns
```

3. **Se souber o contexto**, sugerir documento específico:
   - Trabalhar com BD? → docs/SCHEMA.md
   - Implementar feature? → docs/ROADMAP.md + docs/PATTERNS.md
   - Configurar ambiente? → docs/SETUP.md
   - Debug de problema? → docs/TROUBLESHOOTING.md

## Mapa Rápido de Navegação

| Preciso de... | Ler... |
|---------------|--------|
| Estado actual | PROGRESS.md |
| O que fazer a seguir | docs/ROADMAP.md |
| Schema da BD | docs/SCHEMA.md |
| Configurar ambiente | docs/SETUP.md |
| Padrões de código | docs/PATTERNS.md |
| Comandos úteis | docs/COMMANDS.md |
| Decisões tomadas | docs/DECISIONS.md |
| Stack tecnológica | docs/STACK.md |
| Dados GPX | docs/DATA.md |
| Resolver problemas | docs/TROUBLESHOOTING.md |
| Visão do projecto | docs/VISION.md |
