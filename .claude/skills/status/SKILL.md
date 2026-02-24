---
name: status
description: Mostra o estado actual do projecto Moto Routes. Usa quando precisares de saber em que fase estás, o que foi feito, e o que falta fazer.
allowed-tools: Read, Glob
---

# Skill: Status do Projecto

Quando invocado, deves:

1. **Ler PROGRESS.md** para ver:
   - Fase actual
   - Tarefas concluídas
   - Tarefas em progresso
   - Tarefas pendentes

2. **Verificar métricas**:
   - Rotas importadas (verificar `data/portugal/` e `data/spain/`)
   - Estrutura de pastas existente

3. **Apresentar resumo**:
   - "Estamos na Fase X - [Nome]"
   - "Concluído: [lista breve]"
   - "Em progresso: [lista breve]"
   - "Próximo passo sugerido: [tarefa]"

## Ficheiros a Consultar

- `PROGRESS.md` - Estado detalhado
- `docs/ROADMAP.md` - Plano das 10 fases com critérios
- `CLAUDE.md` - Checklist das fases

## Formato de Resposta

```
## Estado do Projecto Moto Routes

**Fase Actual**: [X] - [Nome da Fase]
**Progresso**: [X]% da fase actual

### Concluído
- [item 1]
- [item 2]

### Em Progresso
- [item actual]

### Próximo Passo
[Descrição do próximo passo a tomar]
```
