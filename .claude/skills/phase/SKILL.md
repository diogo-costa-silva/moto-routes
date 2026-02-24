---
name: phase
description: Mostra detalhes e critérios de validação da fase actual do projecto Moto Routes
user_invocable: true
allowed_tools:
  - Read
---

# Skill: /phase

## Objectivo
Mostrar ao utilizador os detalhes da fase actual do projecto, incluindo critérios de validação e o que falta para avançar.

## Instruções

1. **Ler PROGRESS.md** para identificar:
   - Fase actual (ex: "Fase 0 - Preparação")
   - Tarefas concluídas
   - Tarefas em progresso
   - Tarefas pendentes

2. **Ler docs/ROADMAP.md** para encontrar:
   - Objectivo da fase actual
   - Critérios de validação
   - Deliverables esperados

3. **Responder com formato estruturado**:

```
## Fase Actual: [Nome da Fase]

### Objectivo
[Descrição do objectivo]

### Critérios de Validação
✓ Critério concluído
✓ Critério concluído
○ Critério pendente
○ Critério pendente

### Estado
- Concluído: X de Y critérios
- Progresso: XX%

### Para Avançar
[Lista do que falta fazer para passar à próxima fase]
```

## Notas
- Usar ✓ para critérios concluídos
- Usar ○ para critérios pendentes
- Ser específico sobre o que falta
- Não inventar critérios - usar apenas os documentados no docs/ROADMAP.md
