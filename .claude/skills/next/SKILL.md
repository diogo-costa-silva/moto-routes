---
name: next
description: Sugere a próxima tarefa a fazer no projecto Moto Routes. Usa quando não souberes o que fazer a seguir ou quando terminares uma tarefa.
allowed-tools: Read, Glob
---

# Skill: Próxima Tarefa

Quando invocado, deves:

1. **Ler PROGRESS.md** para identificar:
   - Fase actual
   - O que está "Em Progresso"
   - O que está "Pendente"

2. **Consultar docs/ROADMAP.md** para:
   - Ver detalhes da fase actual
   - Identificar critérios de validação

3. **Sugerir a próxima tarefa** baseado em:
   - Dependências (o que precisa de estar feito primeiro)
   - Complexidade (começar pelo mais simples)
   - Impacto (o que desbloqueia mais trabalho)

## Lógica de Priorização

1. Se há tarefa "Em Progresso" → Continuar essa
2. Se não há "Em Progresso" → Pegar próxima "Pendente" da fase actual
3. Se fase actual concluída → Avançar para próxima fase
4. Se bloqueado → Identificar o que precisa de ser resolvido

## Formato de Resposta

```
## Próxima Tarefa Sugerida

**Fase**: [X] - [Nome]
**Tarefa**: [Descrição da tarefa]

### O que fazer
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

### Critério de Conclusão
[Como saber que está feito]

### Depois desta tarefa
[O que vem a seguir]
```

## Exemplos

Se estamos na Fase 1 e falta criar o schema:
```
## Próxima Tarefa Sugerida

**Fase**: 1 - Fundação
**Tarefa**: Criar e executar schema.sql no Supabase

### O que fazer
1. Criar ficheiro scripts/schema.sql
2. Definir todas as tabelas (routes, journeys, destinations, pois, etc.)
3. Executar no Supabase SQL Editor
4. Verificar que tabelas foram criadas

### Critério de Conclusão
Query `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'` mostra todas as tabelas esperadas.

### Depois desta tarefa
Inicializar frontend com Vite
```
