import { supabase } from '@/lib/supabase';
import type { BasketItem, Question } from '@/types/test';

const BASKET_COLUMNS = 'id, question_id, question, source_test_title, created_at';
const UNIQUE_VIOLATION = '23505';

export async function fetchBasket(): Promise<BasketItem[]> {
  const { data, error } = await supabase
    .from('basket_items')
    .select(BASKET_COLUMNS)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as BasketItem[];
}

export async function addBasketItem(question: Question, sourceTestTitle: string): Promise<BasketItem | null> {
  const { data, error } = await supabase
    .from('basket_items')
    .insert({ question_id: question.id, question, source_test_title: sourceTestTitle })
    .select(BASKET_COLUMNS)
    .single();
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return null;
    throw error;
  }
  return data as BasketItem;
}

export async function removeBasketItems(ids: string[]): Promise<void> {
  const { error } = await supabase.from('basket_items').delete().in('id', ids);
  if (error) throw error;
}
