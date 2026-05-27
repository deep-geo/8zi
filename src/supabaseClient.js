import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://byqlwcqzxvzwbeixvtqb.supabase.co';
const supabaseAnonKey = 'sb_publishable_BkCduyaLruJyoLy5pZX0Gg_Snhir1D7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
