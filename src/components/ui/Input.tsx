"use client";

import React from "react";
import styles from "./Input.module.css";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = "", ...props }, ref) => {
        return (
            <div className={styles.wrapper}>
                {label && (
                    <label className={styles.label} htmlFor={props.id}>
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`${styles.input} ${error ? styles.error : ""} ${className}`}
                    {...props}
                />
                {(error || helperText) && (
                    <span className={`${styles.helper} ${error ? styles.errorText : ""}`}>
                        {error || helperText}
                    </span>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ label, error, helperText, className = "", ...props }, ref) => {
        return (
            <div className={styles.wrapper}>
                {label && (
                    <label className={styles.label} htmlFor={props.id}>
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={`${styles.input} ${styles.textarea} ${error ? styles.error : ""} ${className}`}
                    {...props}
                />
                {(error || helperText) && (
                    <span className={`${styles.helper} ${error ? styles.errorText : ""}`}>
                        {error || helperText}
                    </span>
                )}
            </div>
        );
    }
);

TextArea.displayName = "TextArea";
