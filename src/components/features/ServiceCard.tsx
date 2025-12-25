"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PriceTag } from "@/components/ui/PriceTag";
import { Button } from "@/components/ui/Button";
import styles from "./ServiceCard.module.css";

export interface ServiceCardProps {
    id: string;
    name: string;
    shortDescription: string;
    price: number;
    duration: string;
    image: string;
    popular?: boolean;
    categoryId: string;
    delay?: number;
}

export function ServiceCard({
    id,
    name,
    shortDescription,
    price,
    duration,
    image,
    popular,
    categoryId,
    delay = 0,
}: ServiceCardProps) {
    return (
        <Card
            className={styles.card}
            padding="none"
            animate
            variant="default"
        >
            <Link href={`/service/${id}`} className={styles.link} style={{ animationDelay: `${delay * 50}ms` }}>
                <div className={styles.imageContainer}>
                    <div
                        className={styles.image}
                        style={{
                            backgroundImage: `url(${image})`,
                            backgroundColor: `var(--color-neutral-200)`,
                        }}
                    />
                    {popular && <span className={styles.badge}>Popular</span>}
                </div>

                <div className={styles.content}>
                    <div className={styles.header}>
                        <h3 className={styles.name}>{name}</h3>
                        <PriceTag amount={price} size="md" />
                    </div>

                    <p className={styles.description}>{shortDescription}</p>

                    <div className={styles.footer}>
                        <span className={styles.duration}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {duration}
                        </span>
                        <Button variant="primary" size="sm">
                            Book Now
                        </Button>
                    </div>
                </div>
            </Link>
        </Card>
    );
}
