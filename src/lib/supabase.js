import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Detect missing or placeholder credentials
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "your-project-url" &&
    supabaseAnonKey !== "your-anon-key" &&
    supabaseUrl.startsWith("https://") &&
    supabaseUrl.includes(".supabase.co")
);

if (!isSupabaseConfigured) {
  console.warn(
    "%c⚠️ Supabase not configured",
    "color: orange; font-weight: bold; font-size: 14px",
    "\nCreate a .env file in the project root with:\n" +
      "  VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co\n" +
      "  VITE_SUPABASE_ANON_KEY=your-anon-key\n\n" +
      "Get these from https://app.supabase.com → Project Settings → API\n" +
      "Then restart `npm run dev`."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);
