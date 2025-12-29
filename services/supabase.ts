import { createClient } from '@supabase/supabase-js';

// Credenciales proporcionadas por el usuario
const supabaseUrl = 'https://roktczzuwufftlmyjgbc.supabase.co';
const supabaseAnonKey = 'sb_publishable_cLBVHQE0N8vtRIxj_Dbxtg_GS8DD5xN';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);