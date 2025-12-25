/**
 * Seed script to populate Supabase with initial categories and services
 * Run with: npx tsx scripts/seed-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Categories data (no id - let Supabase generate UUIDs)
const categoriesData = [
    {
        name: 'Facials',
        description: 'Rejuvenating facial treatments for glowing skin',
        icon: '/images/icons/icon-facials.png',
        image: '/images/facial-treatment.png',
        color: '#E8B4B8',
        sort_order: 1,
    },
    {
        name: 'Nails',
        description: 'Manicure & pedicure services for beautiful hands and feet',
        icon: '/images/icons/icon-nails.png',
        image: '/images/nail-manicure.png',
        color: '#D4A5A5',
        sort_order: 2,
    },
    {
        name: 'Lashes & Brows',
        description: 'Enhance your eyes with lash and brow services',
        icon: '/images/icons/icon-lashes.png',
        image: '/images/lash-extensions.png',
        color: '#C9B8A8',
        sort_order: 3,
    },
    {
        name: 'Hair',
        description: 'Professional hair styling and treatment services',
        icon: '/images/icons/icon-hair.png',
        image: '/images/hair-styling.png',
        color: '#B8A9C9',
        sort_order: 4,
    },
    {
        name: 'Body Treatments',
        description: 'Luxurious body treatments for relaxation and rejuvenation',
        icon: '/images/icons/icon-body.png',
        image: '/images/body-treatment.png',
        color: '#A8C9B8',
        sort_order: 5,
    },
    {
        name: 'Massage',
        description: 'Relaxing massage therapies for body and mind',
        icon: '/images/icons/icon-massage.png',
        image: '/images/massage-therapy.png',
        color: '#C9A8B8',
        sort_order: 6,
    },
];

// Services organized by category name
const servicesData: Record<string, Array<{
    name: string;
    description: string;
    short_description: string;
    price: number;
    duration: string;
    image: string;
    steps: Array<{ title: string; description: string }>;
    popular: boolean;
}>> = {
    'Facials': [
        {
            name: 'Signature Glow Facial',
            description: 'Our signature facial treatment combining deep cleansing, exfoliation, and hydration for radiant, glowing skin.',
            short_description: 'Deep cleansing and hydration for radiant skin',
            price: 2500,
            duration: '60 mins',
            image: '/images/facial-treatment.png',
            steps: [
                { title: 'Cleansing', description: 'Double cleanse to remove makeup and impurities' },
                { title: 'Exfoliation', description: 'Gentle enzyme peel to reveal fresh skin' },
                { title: 'Extraction', description: 'Professional extraction of blackheads and whiteheads' },
                { title: 'Mask & Massage', description: 'Hydrating mask with relaxing facial massage' },
            ],
            popular: true,
        },
        {
            name: 'Anti-Aging Facial',
            description: 'Advanced anti-aging treatment with retinol and peptides to reduce fine lines and restore youthful radiance.',
            short_description: 'Combat signs of aging with advanced treatments',
            price: 3500,
            duration: '75 mins',
            image: '/images/facial-treatment.png',
            steps: [
                { title: 'Analysis', description: 'Skin analysis to customize treatment' },
                { title: 'Deep Cleanse', description: 'Thorough cleansing and preparation' },
                { title: 'Treatment', description: 'Application of retinol and peptide serums' },
                { title: 'LED Therapy', description: 'Red light therapy for collagen stimulation' },
            ],
            popular: false,
        },
        {
            name: 'Hydrating Facial',
            description: 'Intensive hydration treatment perfect for dry and dehydrated skin, leaving your face plump and moisturized.',
            short_description: 'Deep hydration for dry skin',
            price: 1800,
            duration: '45 mins',
            image: '/images/facial-treatment.png',
            steps: [
                { title: 'Cleanse', description: 'Gentle milk cleanser for dry skin' },
                { title: 'Hydration Boost', description: 'Hyaluronic acid serum application' },
                { title: 'Mask', description: 'Intensive hydrating sheet mask' },
            ],
            popular: false,
        },
    ],
    'Nails': [
        {
            name: 'Classic Manicure',
            description: 'Traditional manicure including nail shaping, cuticle care, hand massage, and polish application.',
            short_description: 'Essential nail care and polish',
            price: 450,
            duration: '30 mins',
            image: '/images/nail-manicure.png',
            steps: [
                { title: 'Nail Shaping', description: 'File and shape nails to desired style' },
                { title: 'Cuticle Care', description: 'Soften and push back cuticles' },
                { title: 'Polish', description: 'Apply base coat, color, and top coat' },
            ],
            popular: false,
        },
        {
            name: 'Gel Manicure',
            description: 'Long-lasting gel polish manicure with chip-resistant finish that lasts up to 2 weeks.',
            short_description: 'Chip-resistant gel polish that lasts',
            price: 800,
            duration: '45 mins',
            image: '/images/nail-manicure.png',
            steps: [
                { title: 'Prep', description: 'Clean, shape, and prep nails' },
                { title: 'Gel Application', description: 'Apply gel base, color, and top coat with LED curing' },
                { title: 'Finishing', description: 'Cuticle oil and hand cream' },
            ],
            popular: true,
        },
        {
            name: 'Spa Pedicure',
            description: 'Luxurious pedicure with foot soak, exfoliation, callus removal, massage, and polish.',
            short_description: 'Complete foot pampering experience',
            price: 750,
            duration: '60 mins',
            image: '/images/nail-manicure.png',
            steps: [
                { title: 'Foot Soak', description: 'Relaxing aromatic foot bath' },
                { title: 'Exfoliation', description: 'Scrub and callus treatment' },
                { title: 'Massage', description: 'Relaxing foot and leg massage' },
                { title: 'Polish', description: 'Nail shaping and polish application' },
            ],
            popular: false,
        },
    ],
    'Lashes & Brows': [
        {
            name: 'Classic Lash Extensions',
            description: 'Natural-looking individual lash extensions for everyday elegance. One extension per natural lash.',
            short_description: 'Natural individual lash extensions',
            price: 2500,
            duration: '90 mins',
            image: '/images/lash-extensions.png',
            steps: [
                { title: 'Consultation', description: 'Discuss desired look and lash style' },
                { title: 'Preparation', description: 'Cleanse and prep natural lashes' },
                { title: 'Application', description: 'Apply individual extensions lash by lash' },
            ],
            popular: true,
        },
        {
            name: 'Volume Lash Extensions',
            description: 'Dramatic volume lashes with multiple lightweight extensions per natural lash for a full, glamorous look.',
            short_description: 'Full, dramatic lash volume',
            price: 3500,
            duration: '120 mins',
            image: '/images/lash-extensions.png',
            steps: [
                { title: 'Consultation', description: 'Choose your desired volume level' },
                { title: 'Preparation', description: 'Cleanse and isolate natural lashes' },
                { title: 'Application', description: 'Apply handmade volume fans' },
            ],
            popular: false,
        },
        {
            name: 'Brow Lamination',
            description: 'Transform unruly brows into sleek, perfectly shaped brows that stay in place all day.',
            short_description: 'Sleek, styled brows that last',
            price: 1500,
            duration: '45 mins',
            image: '/images/lash-extensions.png',
            steps: [
                { title: 'Shaping', description: 'Define desired brow shape' },
                { title: 'Lamination', description: 'Apply lifting and setting solutions' },
                { title: 'Tinting', description: 'Optional brow tint for definition' },
            ],
            popular: false,
        },
    ],
    'Hair': [
        {
            name: 'Haircut & Style',
            description: 'Professional haircut with wash, blow-dry, and styling tailored to your face shape and lifestyle.',
            short_description: 'Custom cut and professional styling',
            price: 800,
            duration: '60 mins',
            image: '/images/hair-styling.png',
            steps: [
                { title: 'Consultation', description: 'Discuss your desired style' },
                { title: 'Wash', description: 'Shampoo and conditioning treatment' },
                { title: 'Cut', description: 'Precision cutting technique' },
                { title: 'Style', description: 'Blow-dry and finishing' },
            ],
            popular: true,
        },
        {
            name: 'Keratin Treatment',
            description: 'Smoothing keratin treatment to eliminate frizz and add shine for up to 3 months.',
            short_description: 'Frizz-free, smooth hair for months',
            price: 5000,
            duration: '180 mins',
            image: '/images/hair-styling.png',
            steps: [
                { title: 'Cleanse', description: 'Clarifying shampoo to remove buildup' },
                { title: 'Application', description: 'Apply keratin formula section by section' },
                { title: 'Heat Seal', description: 'Flat iron to seal in the treatment' },
            ],
            popular: false,
        },
        {
            name: 'Hair Color',
            description: 'Full hair coloring service with professional consultation and premium color products.',
            short_description: 'Professional coloring service',
            price: 3000,
            duration: '120 mins',
            image: '/images/hair-styling.png',
            steps: [
                { title: 'Consultation', description: 'Color selection and strand test' },
                { title: 'Application', description: 'Apply color with precision' },
                { title: 'Processing', description: 'Allow color to develop' },
                { title: 'Finish', description: 'Rinse, condition, and style' },
            ],
            popular: false,
        },
    ],
    'Body Treatments': [
        {
            name: 'Body Scrub & Wrap',
            description: 'Full body exfoliation followed by a nourishing body wrap to soften and rejuvenate your skin.',
            short_description: 'Exfoliate and nourish your entire body',
            price: 2500,
            duration: '75 mins',
            image: '/images/body-treatment.png',
            steps: [
                { title: 'Dry Brush', description: 'Gentle dry brushing to stimulate circulation' },
                { title: 'Scrub', description: 'Full body sugar or salt scrub' },
                { title: 'Wrap', description: 'Nourishing body mask wrap' },
                { title: 'Moisturize', description: 'Rich body butter application' },
            ],
            popular: false,
        },
        {
            name: 'Slimming Treatment',
            description: 'Targeted body contouring treatment to reduce the appearance of cellulite and sculpt your figure.',
            short_description: 'Body contouring and cellulite reduction',
            price: 3500,
            duration: '90 mins',
            image: '/images/body-treatment.png',
            steps: [
                { title: 'Assessment', description: 'Measure and assess target areas' },
                { title: 'Treatment', description: 'Apply slimming and firming products' },
                { title: 'Massage', description: 'Lymphatic drainage massage technique' },
            ],
            popular: true,
        },
    ],
    'Massage': [
        {
            name: 'Swedish Massage',
            description: 'Classic relaxation massage using long, flowing strokes to relieve tension and promote relaxation.',
            short_description: 'Classic relaxation massage',
            price: 1500,
            duration: '60 mins',
            image: '/images/massage-therapy.png',
            steps: [
                { title: 'Consultation', description: 'Discuss pressure preference and focus areas' },
                { title: 'Massage', description: 'Full body relaxation massage' },
                { title: 'Rest', description: 'Time to relax and absorb the benefits' },
            ],
            popular: true,
        },
        {
            name: 'Deep Tissue Massage',
            description: 'Therapeutic massage targeting deep muscle layers to release chronic tension and knots.',
            short_description: 'Deep muscle tension relief',
            price: 2000,
            duration: '60 mins',
            image: '/images/massage-therapy.png',
            steps: [
                { title: 'Assessment', description: 'Identify problem areas and tension points' },
                { title: 'Warm-up', description: 'Light strokes to warm muscles' },
                { title: 'Deep Work', description: 'Focused deep tissue techniques' },
            ],
            popular: false,
        },
        {
            name: 'Hot Stone Massage',
            description: 'Luxurious massage using heated volcanic stones to melt away tension and promote deep relaxation.',
            short_description: 'Heated stones for deep relaxation',
            price: 2500,
            duration: '75 mins',
            image: '/images/massage-therapy.png',
            steps: [
                { title: 'Stone Heating', description: 'Prepare smooth volcanic stones' },
                { title: 'Placement', description: 'Place warm stones on key points' },
                { title: 'Massage', description: 'Combine stone and hand massage techniques' },
            ],
            popular: false,
        },
    ],
};

async function seed() {
    console.log('🌱 Starting database seed...\n');

    // Delete existing data (in order)
    console.log('🗑️  Clearing existing data...');
    await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert categories and get their UUIDs back
    console.log('📁 Inserting categories...');
    const { data: insertedCats, error: catError } = await supabase
        .from('categories')
        .insert(categoriesData)
        .select();

    if (catError) {
        console.error('Error inserting categories:', catError);
        return;
    }
    console.log(`   ✓ Added ${insertedCats?.length || 0} categories`);

    // Create a map of category name to ID
    const categoryMap = new Map<string, string>();
    insertedCats?.forEach(cat => {
        categoryMap.set(cat.name, cat.id);
    });

    // Insert services with proper category IDs
    console.log('💅 Inserting services...');
    const allServices: Array<any> = [];

    for (const [categoryName, services] of Object.entries(servicesData)) {
        const catId = categoryMap.get(categoryName);
        if (!catId) {
            console.warn(`   ⚠ Category "${categoryName}" not found, skipping services`);
            continue;
        }

        for (const service of services) {
            allServices.push({
                ...service,
                category_id: catId,
            });
        }
    }

    const { error: svcError } = await supabase.from('services').insert(allServices);
    if (svcError) {
        console.error('Error inserting services:', svcError);
        return;
    }
    console.log(`   ✓ Added ${allServices.length} services`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nCategories:');
    insertedCats?.forEach(c => console.log(`   - ${c.name} (${c.id})`));
    console.log('\nServices per category:');
    for (const [name, services] of Object.entries(servicesData)) {
        console.log(`   - ${name}: ${services.length} services`);
    }
}

seed().catch(console.error);
