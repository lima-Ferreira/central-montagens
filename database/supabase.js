const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ ERRO: SUPABASE_URL ou SUPABASE_ANON_KEY não foram definidas no arquivo .env",
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;
