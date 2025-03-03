 
import { createClient } from '@supabase/supabase-js';

// Obtém a URL e a chave anônima do arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Credenciais do Supabase não encontradas. Verifique o arquivo .env');
}

// Cria o cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;