"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Service } from "@/config/services.config";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { PriceTag } from "@/components/ui/PriceTag";
import styles from "./page.module.css";

interface ServicePageProps {
    params: Promise<{ id: string }>;
}

type ServiceWithCategory = Service & { categoryId: string; categoryName: string };

function ServicePageContent({ params }: ServicePageProps) {
    const searchParams = useSearchParams();

    const from = searchParams.get("from");
    const currentServices = searchParams.get("currentServices");
    const originalService = searchParams.get("originalService");

    const [service, setService] = useState<ServiceWithCategory | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const loadService = async () => {
            const { id } = await params;

            // Fetch service from Supabase
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) {
                setNotFound(true);
                setIsLoading(false);
                return;
            }

            // Fetch category name from Supabase
            const { data: catData } = await supabase
                .from('categories')
                .select('name')
                .eq('id', data.category_id)
                .single();

            const dbService: ServiceWithCategory = {
                id: data.id,
                name: data.name,
                description: data.description,
                shortDescription: data.short_description,
                price: data.price,
                duration: data.duration,
                image: data.image || '/images/placeholder-service.png',
                steps: data.steps || [],
                popular: data.popular,
                categoryId: data.category_id,
                categoryName: catData?.name || 'Service',
            };

            setService(dbService);
            setIsLoading(false);
        };

        loadService();
    }, [params]);

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

    if (notFound || !service) {
        return (
            <div className={styles.page}>
                <div className={styles.meshBackground}>
                    <div className={styles.meshOrb1} />
                    <div className={styles.meshOrb2} />
                    <div className={styles.meshOrb3} />
                    <div className={styles.meshOrb4} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
                    <p style={{ color: 'var(--bronze-light)' }}>Service not found</p>
                    <Link href="/">
                        <Button variant="primary">Go Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Determine back href based on where user came from
    let backHref = "/";
    if (from === "booking") {
        if (currentServices) {
            backHref = `/booking?services=${currentServices}`;
        } else if (originalService) {
            backHref = `/booking?service=${originalService}`;
        } else {
            backHref = "/booking";
        }
    } else {
        backHref = `/category/${service.categoryId}`;
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

            {/* Content Wrapper */}
            <div className={styles.contentWrapper}>
                {/* Header Card with Image */}
                <div className={styles.headerCard}>
                    <Link href={backHref} className={styles.backButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </Link>

                    {/* Service Image */}
                    <div className={styles.imageContainer}>
                        <Image
                            src={service.image}
                            alt={service.name}
                            fill
                            className={styles.image}
                        />
                    </div>

                    {/* Service Info */}
                    <div className={styles.serviceInfo}>
                        <span className={styles.categoryBadge}>{service.categoryName}</span>
                        <h1 className={styles.title}>{service.name}</h1>
                        <p className={styles.description}>{service.description}</p>

                        <div className={styles.meta}>
                            <div className={styles.metaItem}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>{service.duration}</span>
                            </div>
                            <PriceTag amount={service.price} size="lg" />
                        </div>
                    </div>
                </div>

                {/* Steps Card */}
                {service.steps && service.steps.length > 0 && (
                    <div className={styles.stepsCard}>
                        <h2 className={styles.stepsTitle}>
                            <span className={styles.stepsIcon}>✨</span>
                            What&apos;s Included
                        </h2>
                        <ol className={styles.stepsList}>
                            {service.steps.map((step, index) => (
                                <li key={index} className={styles.stepItem}>
                                    <span className={styles.stepNumber}>{index + 1}</span>
                                    <div className={styles.stepContent}>
                                        <h3 className={styles.stepTitle}>{step.title}</h3>
                                        <p className={styles.stepDescription}>{step.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
            </div>

            {/* Fixed Bottom CTA */}
            <div className={styles.bottomCta}>
                <div className={styles.bottomCtaContent}>
                    <div className={styles.priceSection}>
                        <span className={styles.priceLabel}>Total</span>
                        <PriceTag amount={service.price} size="lg" />
                    </div>
                    {from === "booking" ? (
                        <Link
                            href={`/booking?${currentServices ? `services=${currentServices}&` : (originalService ? `service=${originalService}&` : '')}addService=${service.id}`}
                            className={styles.bookLink}
                        >
                            <Button variant="primary" size="lg" fullWidth>
                                Add to Booking
                            </Button>
                        </Link>
                    ) : (
                        <Link href={`/booking?service=${service.id}`} className={styles.bookLink}>
                            <Button variant="primary" size="lg" fullWidth>
                                Book Now
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ServicePage({ params }: ServicePageProps) {
    return (
        <Suspense fallback={
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
        }>
            <ServicePageContent params={params} />
        </Suspense>
    );
}
