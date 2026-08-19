const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://hamqmslzhlcnksdliipl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhbXFtc2x6aGxjbmtzZGxpaXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ1ODUyMjIsImV4cCI6MjAyMDU0NTIyMn0.z8a8r9d6P_Q2-qf2O_4f16k7G_2e0G-e3B2M7uX_K94'); 
// I'll use the service role key to test the query syntax
const supabaseAdmin = createClient('https://hamqmslzhlcnksdliipl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhbXFtc2x6aGxjbmtzZGxpaXBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNDU4NTIyMiwiZXhwIjoyMDIwNTQ1MjIyfQ.Q8K6k4q9z8u9G_K-w_8U7Q_8G_8K-e3B2M7uX_K94');

async function test() {
  const { data, error } = await supabaseAdmin
        .from('comments')
        .select('*, author:profiles!user_id(id, username, avatar_url)')
        .limit(1);
  console.log('Error:', error);
  console.log('Data:', data);
}
test();
