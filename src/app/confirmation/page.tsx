"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site.config";
import { Button } from "@/components/ui/Button";

import { PriceTag } from "@/components/ui/PriceTag";
import styles from "./page.module.css";

interface BookingData {
    services: {
        id: string;
        name: string;
        image: string;
        price: number;
        duration: string;
        categoryName: string;
    }[];
    date: string;
    time: string;
    customer: {
        name: string;
        phone: string;
        email: string;
        notes: string;
    };
}

export default function ConfirmationPage() {
    const router = useRouter();
    const [booking, setBooking] = useState<BookingData | null>(null);
    const [showConfetti, setShowConfetti] = useState(true);
    const [confettiPieces, setConfettiPieces] = useState<Array<{ left: string; delay: string; color: string }>>([]);

    useEffect(() => {
        const storedBooking = sessionStorage.getItem("booking");
        if (storedBooking) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setBooking(JSON.parse(storedBooking));
        } else {
            // No booking data found, redirect to home
            router.push("/");
            return;
        }

        // Generate confetti positions on client side only to prevent hydration mismatch
        setConfettiPieces(
            [...Array(40)].map((_, i) => ({
                left: `${Math.random() * 100}%`,
                delay: `${Math.random() * 0.8}s`,
                color: ["#d4af37", "#c45c35", "#e8dfd5", "#FFFFFF"][i % 4],
            }))
        );

        // Hide confetti after animation
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
    }, [router]);

    if (!booking) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    // Parse date in local timezone (new Date("YYYY-MM-DD") interprets as UTC)
    const [year, month, day] = booking.date.split('-').map(Number);
    const bookingDate = new Date(year, month - 1, day);
    const formattedDate = bookingDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    // Generate Add to Calendar link (Google Calendar)
    const calendarUrl = (() => {
        // Parse date in local timezone
        const [calYear, calMonth, calDay] = booking.date.split('-').map(Number);
        const startTime = new Date(calYear, calMonth - 1, calDay);
        const [hours, minutes, period] = booking.time.match(/(\d+):(\d+)\s*(AM|PM)/i)?.slice(1) || [];
        let hour = parseInt(hours || "0");
        if (period?.toUpperCase() === "PM" && hour !== 12) hour += 12;
        if (period?.toUpperCase() === "AM" && hour === 12) hour = 0;
        startTime.setHours(hour, parseInt(minutes || "0"));

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 60); // Default 1 hour

        const formatForCal = (date: Date) =>
            date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

        const serviceNames = booking.services.map(s => s.name).join(", ");
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(serviceNames + " at " + siteConfig.name)}&dates=${formatForCal(startTime)}/${formatForCal(endTime)}&location=${encodeURIComponent(siteConfig.contact.address)}&details=${encodeURIComponent("Booked via " + siteConfig.name)}`;
    })();

    return (
        <div className={styles.page}>
            {/* Mesh Background */}
            <div className={styles.meshBackground}>
                <div className={styles.meshOrb1} />
                <div className={styles.meshOrb2} />
                <div className={styles.meshOrb3} />
            </div>

            {/* Confetti Animation */}
            {showConfetti && (
                <div className={styles.confetti}>
                    {confettiPieces.map((piece, i) => (
                        <div
                            key={i}
                            className={styles.confettiPiece}
                            style={{
                                left: piece.left,
                                animationDelay: piece.delay,
                                backgroundColor: piece.color,
                            }}
                        />
                    ))}
                </div>
            )}

            <div className={styles.container}>
                {/* Unified Glass Card */}
                <div className={styles.confirmationCard}>
                    {/* Success Icon */}
                    <div className={styles.successIconWrapper}>
                        <div className={styles.successIcon}>
                            <svg className={styles.checkmark} viewBox="0 0 52 52">
                                <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none" />
                                <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                            </svg>
                        </div>
                    </div>

                    {/* Header */}
                    <div className={styles.header}>
                        <h1 className={styles.title}>Booking Confirmed!</h1>
                        <p className={styles.subtitle}>
                            We can&apos;t wait to pamper you
                        </p>
                    </div>

                    <div className={styles.divider} />

                    {/* Services List */}
                    <div className={styles.servicesList}>
                        {booking.services.map((service, index) => (
                            <div key={`${service.id}-${index}`} className={styles.serviceRow}>
                                <div
                                    className={styles.serviceImage}
                                    style={{
                                        backgroundImage: `url(${service.image})`,
                                        backgroundColor: "var(--color-neutral-200)",
                                    }}
                                />
                                <div className={styles.serviceInfo}>
                                    <h2 className={styles.serviceName}>{service.name}</h2>
                                    <span className={styles.serviceCategory}>{service.categoryName}</span>
                                </div>
                                <div className={styles.servicePrice}>
                                    <PriceTag amount={service.price} size="md" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.dividerWithText}>DETAILS</div>

                    {/* Details Grid */}
                    <div className={styles.detailsGrid}>
                        <div className={styles.detailItem}>
                            <div className={styles.detailIcon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <div className={styles.detailContent}>
                                <span className={styles.detailLabel}>Date</span>
                                <span className={styles.detailValue}>{formattedDate}</span>
                            </div>
                        </div>

                        <div className={styles.detailItem}>
                            <div className={styles.detailIcon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                            <div className={styles.detailContent}>
                                <span className={styles.detailLabel}>Time</span>
                                <span className={styles.detailValue}>{booking.time}</span>
                            </div>
                        </div>

                        <div className={styles.detailItem}>
                            <div className={styles.detailIcon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            <div className={styles.detailContent}>
                                <span className={styles.detailLabel}>Guest</span>
                                <span className={styles.detailValue}>{booking.customer.name}</span>
                            </div>
                        </div>

                        {booking.customer.notes && (
                            <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                                <div className={styles.detailIcon}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                </div>
                                <div className={styles.detailContent}>
                                    <span className={styles.detailLabel}>Notes</span>
                                    <span className={styles.detailValue}>{booking.customer.notes}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>Service Total</span>
                        <PriceTag amount={booking.services.reduce((sum, s) => sum + s.price, 0)} size="lg" className={styles.totalPrice} />
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                        <a
                            href={calendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.calendarLink}
                        >
                            <Button variant="outline" size="lg" fullWidth className={styles.goldBtn}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                Add to Calendar
                            </Button>
                        </a>

                        <Link href="/" className={styles.homeLink}>
                            <Button variant="primary" size="lg" fullWidth>
                                Book Another Service
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Contact Info */}
                <p className={styles.contactNote}>
                    Need to reschedule? Call us at{" "}
                    <a href={`tel:${siteConfig.contact.phone}`} className={styles.phoneLink}>
                        {siteConfig.contact.phone}
                    </a>
                </p>
            </div>
        </div>
    );
}
