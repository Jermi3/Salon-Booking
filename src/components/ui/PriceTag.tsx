import React from "react";
import { siteConfig } from "@/config/site.config";
import styles from "./PriceTag.module.css";

export interface PriceTagProps {
    amount: number;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function PriceTag({ amount, size = "md", className = "" }: PriceTagProps) {
    const formatted = amount.toLocaleString("en-PH");

    return (
        <span className={`${styles.price} ${styles[size]} ${className}`}>
            <span className={styles.currency}>{siteConfig.currency}</span>
            {formatted}
        </span>
    );
}
