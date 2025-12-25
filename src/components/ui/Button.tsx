"use client";

import React from "react";
import styles from "./Button.module.css";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
    loading?: boolean;
    children: React.ReactNode;
}

export function Button({
    variant = "primary",
    size = "md",
    fullWidth = false,
    loading = false,
    children,
    className = "",
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            className={`${styles.button} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.fullWidth : ""} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className={styles.loader} />
            ) : (
                children
            )}
        </button>
    );
}
