import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
