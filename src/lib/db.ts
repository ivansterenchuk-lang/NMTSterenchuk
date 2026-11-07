import { supabase } from './supabase';
import type { ClassItem } from './classroom';

// ---------- СЕСІЇ ----------
export const fetchSessionsFromDB = async () => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
  return data || [];
};

export const saveSessionToDB = async (session: any) => {
  if (!supabase) return;
  
  const { error } = await supabase
    .from('sessions')
    .upsert({ 
      id: session.id,
      title: session.title,
      tag: session.tag,
      status: session.status,
      students_count: session.studentsCount,
      date: session.date,
      questions: session.questions || []
    }, { onConflict: 'id' });
    
  if (error) {
    alert(`❌ ПОМИЛКА БАЗИ:\n${error.message}\n${error.details || ''}`);
    console.error('Error saving session:', error);
  } else {
    console.log('✅ Сесію збережено:', session.id);
  }
};

// ---------- КЛАСИ ----------
export const fetchClassesFromDB = async () => {
  if (!supabase) return [];
  const { data, error } = await supabase.from('classes').select('*');
  
  if (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
  return data.map(row => row.data as ClassItem);
};

export const saveClassesToDB = async (classes: ClassItem[]) => {
  if (!supabase) return;
  
  const { error: deleteError } = await supabase.from('classes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (deleteError) {
    console.error('Error clearing classes:', deleteError);
    return;
  }

  if (classes.length === 0) return;
  
  const rows = classes.map(c => ({
    id: c.id,
    name: c.name,
    data: c
  }));

  const { error } = await supabase.from('classes').insert(rows);
  if (error) console.error('Error saving classes:', error);
};