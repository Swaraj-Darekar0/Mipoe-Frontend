import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Project URL and Anon Key from Supabase Dashboard
const SUPABASE_URL = 'https://llvpnkpyeprgakqglshw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsdnBua3B5ZXByZ2FrcWdsc2h3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ1NTM4OCwiZXhwIjoyMDk1MDMxMzg4fQ.mdr3bUWub_l82V-PjHjKdEhmFbcgRvCZV95GwuDBqyU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);