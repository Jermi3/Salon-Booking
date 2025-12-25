"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

export interface HeaderProps {
    showBack?: boolean;
    backHref?: string;
    onBackClick?: () => void;
    title?: string;
    transparent?: boolean;
    showLogo?: boolean;
}

export function Header({
    showBack = false,
    backHref = "/",
    onBackClick,
    title,
    transparent = false,
    showLogo = false,
}: HeaderProps) {
    return (
        <header className={`${styles.header} ${transparent ? styles.transparent : ""}`}>
            <div className={styles.container}>
                {showBack ? (
                    onBackClick ? (
                        <button
                            type="button"
                            className={styles.backButton}
                            onClick={onBackClick}
                            aria-label="Go back"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5" />
                                <path d="m12 19-7-7 7-7" />
                            </svg>
                        </button>
                    ) : (
                        <Link href={backHref} className={styles.backButton} aria-label="Go back">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5" />
                                <path d="m12 19-7-7 7-7" />
                            </svg>
                        </Link>
                    )
                ) : (
                    <div className={styles.spacer} />
                )}

                {title && <h1 className={styles.title}>{title}</h1>}

                {showLogo && (
                    <div className={styles.logo}>
                        <Image
                            src="/logo-icon.png"
                            alt="Logo"
                            width={40}
                            height={40}
                            priority
                        />
                    </div>
                )}

                <div className={styles.spacer} />
            </div>
        </header>
    );
}
