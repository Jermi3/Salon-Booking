"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./CategoryButton.module.css";

export interface CategoryButtonProps {
    id: string;
    name: string;
    icon: string;
    color?: string;
    image?: string;
    href: string;
    delay?: number;
}

export function CategoryButton({
    name,
    color,
    image,
    href,
    delay = 0,
}: CategoryButtonProps) {
    return (
        <Link
            href={href}
            className={styles.button}
            style={{
                animationDelay: `${delay * 80}ms`,
            }}
        >
            <div
                className={styles.card}
                style={{
                    backgroundColor: color || "var(--color-neutral-200)",
                }}
            >
                {/* Background image layer */}
                {image && (
                    <div className={styles.imageWrapper}>
                        <Image
                            src={image}
                            alt={name}
                            fill
                            sizes="(max-width: 768px) 50vw, 200px"
                            style={{ objectFit: "cover" }}
                        />
                    </div>
                )}

                {/* Gradient overlay for depth */}
                <div className={styles.cardOverlay} />

                {/* Shine effect */}
                <div className={styles.shine} />
            </div>
            <span className={styles.label}>{name}</span>
        </Link>
    );
}
