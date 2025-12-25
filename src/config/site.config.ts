/**
 * Site Configuration
 * 
 * This file contains all the salon-specific information.
 * When duplicating this template for a new client, update these values.
 */

export const siteConfig = {
  // Salon branding
  name: "Luxe Beauty Studio",
  tagline: "Your Beauty, Our Passion",
  description: "Premium aesthetic salon services for the modern you",
  
  // Logo paths (relative to /public)
  logo: "/logo.png",
  logoIcon: "/logo-icon.png",
  
  // Currency settings
  currency: "₱",
  currencyCode: "PHP",
  
  // Contact information
  contact: {
    phone: "+63 912 345 6789",
    email: "hello@luxebeauty.ph",
    address: "123 Main Street, Makati City, Philippines",
    hours: "Mon-Sat: 9:00 AM - 8:00 PM",
  },
  
  // Social media links
  social: {
    facebook: "https://facebook.com/luxebeauty",
    instagram: "https://instagram.com/luxebeauty",
    tiktok: "https://tiktok.com/@luxebeauty",
  },
  
  // SEO
  seo: {
    title: "Luxe Beauty Studio | Premium Aesthetic Salon",
    description: "Experience luxury beauty treatments at Luxe Beauty Studio. Facials, nails, lashes, hair, and more.",
    keywords: ["beauty salon", "aesthetic salon", "facials", "nails", "lashes", "makati"],
  },
} as const;

export type SiteConfig = typeof siteConfig;
