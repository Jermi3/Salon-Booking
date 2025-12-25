/**
 * Services Configuration
 * 
 * Type definitions for services and categories.
 * All data is now stored in Supabase database.
 */

export interface ServiceStep {
    title: string;
    description: string;
}

export interface Service {
    id: string;
    name: string;
    description: string;
    shortDescription: string;
    price: number;
    duration: string; // e.g., "60 mins"
    image: string;
    steps: ServiceStep[];
    popular?: boolean;
}

export interface ServiceCategory {
    id: string;
    name: string;
    description: string;
    icon: string; // Emoji or icon name
    image: string;
    color: string; // Accent color for this category
    services: Service[];
}

// No hardcoded categories - all data comes from Supabase database
// Use the ServicesContext to access categories and services
