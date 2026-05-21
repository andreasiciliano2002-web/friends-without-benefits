import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://bljrordabqfrlkvmenkj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsanJvcmRhYnFmcmxrdm1lbmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3ODA0MzAsImV4cCI6MjA5NDM1NjQzMH0.WV_KZW54uMSH3yv7QJZEL_1CygjABkNOtByPrFt_Dz0'
);
