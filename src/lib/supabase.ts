import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,      // Зберігати сесію між перезавантаженнями
        autoRefreshToken: true,    // Автоматично оновлювати токен
        detectSessionInUrl: true,  // Підтримка входу за посиланням
        storage: window.localStorage // Використовувати локальне сховище браузера
      }
    })
  : null;