import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Lazy initialization to prevent build-time errors
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (!supabaseInstance) {
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
        }
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseInstance;
}

// Proxy to make supabase.from(), supabase.auth, etc. work directly
export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        return getSupabaseClient()[prop as keyof SupabaseClient];
    }
});

// Type definitions for database tables
export interface DbService {
    id: string;
    category_id: string;
    name: string;
    description: string;
    short_description: string;
    price: number;
    duration: string;
    image: string;
    steps: { title: string; description: string }[];
    popular: boolean;
    created_at: string;
    updated_at: string;
}
