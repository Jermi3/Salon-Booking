"use client";

import React from "react";
import styles from "./Card.module.css";

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "elevated" | "outlined";
    padding?: "none" | "sm" | "md" | "lg";
    onClick?: () => void;
    animate?: boolean;
}

export function Card({
    children,
    className = "",
    variant = "default",
    padding = "md",
    onClick,
    animate = false,
}: CardProps) {
    const Component = onClick ? "button" : "div";

    return (
        <Component
            className={`${styles.card} ${styles[variant]} ${styles[`padding-${padding}`]} ${animate ? styles.animate : ""} ${onClick ? styles.clickable : ""} ${className}`}
            onClick={onClick}
        >
            {children}
        </Component>
    );
}
