"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site.config";
import { supabase } from "@/lib/supabase";
import { CategoryButton } from "@/components/ui/CategoryButton";
import styles from "./page.module.css";

interface Category {
  id: string;
  name: string;
  description?: string;
  icon: string;
  image: string;
  color: string;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        // Fetch categories from database
        const { data: dbCategories, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!error && dbCategories) {
          // Map database categories to our format
          const mappedCategories: Category[] = dbCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            description: cat.description || '',
            icon: cat.icon || '/images/icons/icon-default.png',
            image: cat.image || '/images/placeholder-category.png',
            color: cat.color || '#E8B4B8',
          }));

          setCategories(mappedCategories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  return (
    <div className={styles.page}>
      {/* Full Page Mesh Gradient Background */}
      <div className={styles.meshBackground}>
        <div className={styles.meshOrb1} />
        <div className={styles.meshOrb2} />
        <div className={styles.meshOrb3} />
        <div className={styles.meshOrb4} />
        <div className={styles.meshOrb5} />
      </div>

      {/* Content Wrapper with White Cards */}
      <div className={styles.contentWrapper}>
        {/* Hero Card */}
        <div className={styles.heroCard}>
          <div className={styles.logoContainer}>
            <div className={styles.logoMark}>
              <div className={styles.logoLines}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className={styles.logoText}>
              <span className={styles.brandMain}>PA RESERVE</span>
              <span className={styles.brandAccent}>PH</span>
            </div>
          </div>
          <p className={styles.tagline}>Premium Beauty Booking</p>
        </div>

        {/* Services Card */}
        <div className={styles.servicesCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Explore</span>
            <h2 className={styles.sectionTitle}>Our Services</h2>
          </div>

          <div className={styles.grid}>
            {isLoading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                Loading services...
              </div>
            ) : categories.length > 0 ? (
              categories.map((category, index) => (
                <CategoryButton
                  key={category.id}
                  id={category.id}
                  name={category.name}
                  icon={category.icon}
                  color={category.color}
                  image={category.image}
                  href={`/category/${category.id}`}
                  delay={index}
                />
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                No services available yet
              </div>
            )}
          </div>
        </div>

        {/* Footer Card */}
        <div className={styles.footerCard}>
          <div className={styles.footerContent}>
            <p className={styles.footerAddress}>{siteConfig.contact.address}</p>
            <a href={`tel:${siteConfig.contact.phone}`} className={styles.phoneButton}>
              {siteConfig.contact.phone}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
