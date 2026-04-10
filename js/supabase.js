// Supabase is loaded as a global via <script> tag in each HTML file.
// window.supabase is the library namespace; createClient is inside it.
const { createClient } = window.supabase

export const SUPABASE_URL      = 'https://wkiuzbsvydmvqjowhnxf.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndraXV6YnN2eWRtdnFqb3dobnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzEyNTUsImV4cCI6MjA5MTIwNzI1NX0.CcLnJgrNdETrdIW-hclDeHUnzOuHQjkW9ZJRXf_nR6k'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
