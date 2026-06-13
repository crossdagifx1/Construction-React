import "dotenv/config"; // ensure env is loaded before reading SUPABASE_* vars
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only create the client when configured — uploads return a clear error otherwise.
export const supabase = url && key ? createClient(url, key) : null;
export const BUCKET = process.env.SUPABASE_BUCKET || "media";

export const isStorageConfigured = () => Boolean(supabase);
