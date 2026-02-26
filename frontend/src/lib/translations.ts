import { supabase } from './supabase'

export async function fetchTranslations(
  entityType: 'route' | 'journey' | 'destination',
  lang: string
): Promise<Map<string, Record<string, string>>> {
  type TranslationRow = { entity_id: string; field: string; value: string }
  const { data } = await supabase
    .from('translations')
    .select('entity_id, field, value')
    .eq('entity_type', entityType)
    .eq('lang', lang)
  const map = new Map<string, Record<string, string>>()
  for (const row of (data ?? []) as unknown as TranslationRow[]) {
    if (!map.has(row.entity_id)) map.set(row.entity_id, {})
    map.get(row.entity_id)![row.field] = row.value
  }
  return map
}
