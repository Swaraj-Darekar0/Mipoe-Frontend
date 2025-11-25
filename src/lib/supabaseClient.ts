import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Project URL and Anon Key from Supabase Dashboard
const SUPABASE_URL = 'https://akwemefewfmzxegidesl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrd2VtZWZld2ZtenhlZ2lkZXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgzMjM2OSwiZXhwIjoyMDY3NDA4MzY5fQ.37BCxgLRqb0e6W-IxdCCuVz_idG1lRNnUDV3fk-6Uog';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);