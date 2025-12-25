"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Service, ServiceCategory } from "@/config/services.config";
import { supabase } from "@/lib/supabase";
import { ServiceCard } from "@/components/features/ServiceCard";
import styles from "./page.module.css";

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
    const [category, setCategory] = useState<ServiceCategory | null>(null);
    const [isSticky, setIsSticky] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const heroCardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadCategory = async () => {
            setIsLoading(true);
            const { slug } = await params;

            // Fetch category from Supabase
            const { data: dbCategory, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('id', slug)
                .single();

            if (catError || !dbCategory) {
                setCategory(null);
                setIsLoading(false);
                return;
            }

            // Fetch services from Supabase for this category
            const { data: dbServices } = await supabase
                .from('services')
                .select('*')
                .eq('category_id', slug)
                .order('created_at', { ascending: false });

            // Transform database services to match Service type
            const services: Service[] = (dbServices || []).map((s) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                shortDescription: s.short_description,
                price: s.price,
                duration: s.duration,
                image: s.image || '/images/placeholder-service.png',
                steps: s.steps || [],
                popular: s.popular,
            }));

            setCategory({
                id: dbCategory.id,
                name: dbCategory.name,
                description: dbCategory.description || '',
                icon: dbCategory.icon || '',
                image: dbCategory.image || '',
                color: dbCategory.color || '#E8B4B8',
                services,
            });
            setIsLoading(false);
        };

        loadCategory();
    }, [params]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollThreshold = 180;
            setIsSticky(window.scrollY > scrollThreshold);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (isLoading) {
        return (
            <div className={styles.page}>
                <div className={styles.meshBackground}>
                    <div className={styles.meshOrb1} />
                    <div className={styles.meshOrb2} />
                    <div className={styles.meshOrb3} />
                    <div className={styles.meshOrb4} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: 'var(--bronze-light)' }}>
                    Loading...
                </div>
            </div>
        );
    }

    if (!category) {
        return null;
    }

    return (
        <div className={styles.page}>
            {/* Full Page Mesh Gradient Background */}
            <div className={styles.meshBackground}>
                <div className={styles.meshOrb1} />
                <div className={styles.meshOrb2} />
                <div className={styles.meshOrb3} />
                <div className={styles.meshOrb4} />
            </div>

            {/* Morphing Hero Card */}
            <div
                ref={heroCardRef}
                className={`${styles.heroCard} ${isSticky ? styles.sticky : ""}`}
            >
                {/* Title row with back button, centered title, and star badge */}
                <div className={styles.titleRow}>
                    <Link href="/" className={styles.backButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className={styles.title}>{category.name}</h1>
                    <div className={styles.starBadge}>★</div>
                </div>

                <div className={styles.heroContent}>
                    <p className={styles.description}>{category.description}</p>

                    <div className={styles.statsRow}>
                        <div className={styles.stat}>
                            <span className={styles.statNumber}>{category.services.length}</span>
                            <span className={styles.statLabel}>Services</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.stat}>
                            <span className={styles.statIcon}>★</span>
                            <span className={styles.statLabel}>Top Rated</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Wrapper - No container card, just spacing */}
            <div className={styles.contentWrapper}>
                {/* Section Header Card */}
                <div className={styles.sectionHeaderCard}>
                    <span className={styles.sectionLabel}>Choose</span>
                    <h2 className={styles.sectionTitle}>Available Services</h2>
                </div>

                {/* Empty state */}
                {category.services.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--bronze-light)' }}>
                        No services available in this category yet.
                    </div>
                )}

                {/* Individual Service Cards - Each is its own floating card */}
                {category.services.map((service, index) => (
                    <ServiceCard
                        key={service.id}
                        id={service.id}
                        name={service.name}
                        shortDescription={service.shortDescription}
                        price={service.price}
                        duration={service.duration}
                        image={service.image}
                        popular={service.popular}
                        categoryId={category.id}
                        delay={index}
                    />
                ))}
            </div>
        </div>
    );
}
