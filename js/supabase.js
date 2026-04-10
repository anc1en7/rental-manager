import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ⚠️  REPLACE THESE with your Supabase project credentials.
// Find them in: Supabase Dashboard → your project → Settings → API
export const SUPABASE_URL      = 'https://wkiuzbsvydmvqjowhnxf.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndraXV6YnN2eWRtdnFqb3dobnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzEyNTUsImV4cCI6MjA5MTIwNzI1NX0.CcLnJgrNdETrdIW-hclDeHUnzOuHQjkW9ZJRXf_nR6k'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
