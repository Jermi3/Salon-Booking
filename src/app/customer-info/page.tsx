"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Service } from "@/config/services.config";
import { supabase } from "@/lib/supabase";
import { Header } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { PriceTag } from "@/components/ui/PriceTag";
import styles from "./page.module.css";

type ServiceWithCategory = Service & { categoryId: string; categoryName: string };

// Helper to get service from database
async function getServiceById(id: string): Promise<ServiceWithCategory | null> {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return null;

    // Fetch category name
    const { data: catData } = await supabase
        .from('categories')
        .select('name')
        .eq('id', data.category_id)
        .single();

    return {
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
}

function CustomerInfoContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const servicesParam = searchParams.get("services");
    const serviceId = searchParams.get("service"); // Fallback for single service legacy links
    const dateParam = searchParams.get("date");
    const timeParam = searchParams.get("time");

    const [selectedServices, setSelectedServices] = useState<ServiceWithCategory[]>([]);

    // Initialize date/time lazily to avoid side-effects
    const [selectedDate] = useState<Date | null>(() => {
        if (dateParam) {
            const [year, month, day] = dateParam.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        return null;
    });

    const [selectedTime] = useState<string | null>(() => {
        return timeParam ? decodeURIComponent(timeParam) : null;
    });

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        notes: "",
    });
    const [honeypot, setHoneypot] = useState(""); // Anti-spam honeypot
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        const loadServices = async () => {
            const services: ServiceWithCategory[] = [];

            if (servicesParam) {
                const serviceIds = servicesParam.split(",");
                for (const id of serviceIds) {
                    const service = await getServiceById(id);
                    if (service) services.push(service);
                }
            } else if (serviceId) {
                const service = await getServiceById(serviceId);
                if (service) services.push(service);
            }

            setSelectedServices(services);
        };

        loadServices();
    }, [servicesParam, serviceId]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        // Validate strictly: Must be 11 digits and start with 09
        if (selectedServices.length === 0 || !selectedDate || !selectedTime || !formData.name || !formData.phone || !/^09\d{9}$/.test(formData.phone)) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Get reCAPTCHA token if available
            let recaptchaToken = null;
            const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
            if (siteKey && typeof window !== 'undefined' && (window as unknown as { grecaptcha?: { ready: (cb: () => void) => void; execute: (key: string, options: { action: string }) => Promise<string> } }).grecaptcha) {
                const grecaptcha = (window as unknown as { grecaptcha: { ready: (cb: () => void) => void; execute: (key: string, options: { action: string }) => Promise<string> } }).grecaptcha;
                await new Promise<void>((resolve) => grecaptcha.ready(resolve));
                recaptchaToken = await grecaptcha.execute(siteKey, { action: 'submit_booking' });
            }

            // Format services for API
            const servicesForApi = selectedServices.map(s => ({
                id: s.id,
                name: s.name,
                price: s.price,
                duration: s.duration,
            }));

            // Format date for API (YYYY-MM-DD) - use local timezone, not UTC
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            // Call secure booking API
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName: formData.name,
                    customerEmail: formData.email || '',
                    customerPhone: formData.phone,
                    services: servicesForApi,
                    bookingDate: formattedDate,
                    bookingTime: selectedTime,
                    notes: formData.notes || null,
                    totalPrice: total,
                    recaptchaToken,
                    honeypot, // Hidden field - should be empty
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                setSubmitError(result.error || 'Failed to submit booking. Please try again.');
                setIsSubmitting(false);
                return;
            }

            // Store booking data in sessionStorage for confirmation page
            // Use the formattedDate we already computed for consistency
            sessionStorage.setItem("booking", JSON.stringify({
                id: result.booking.id,
                services: selectedServices,
                date: formattedDate,
                time: selectedTime,
                customer: formData,
            }));

            router.push("/confirmation");
        } catch (error) {
            console.error('Booking error:', error);
            setSubmitError('Failed to submit booking. Please try again.');
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        // Navigate back to booking page with preserved state
        const params = new URLSearchParams();
        if (selectedServices.length > 0) {
            params.set("services", selectedServices.map(s => s.id).join(","));
        } else if (serviceId) {
            params.set("service", serviceId);
        }

        if (dateParam) params.set("date", dateParam);
        if (timeParam) params.set("time", timeParam);
        router.push(`/booking?${params.toString()}`);
    };

    const total = selectedServices.reduce((sum, s) => sum + s.price, 0);

    // Show error state if missing required booking data
    if ((!servicesParam && !serviceId) || !dateParam || !timeParam) {
        return (
            <div className={styles.page}>
                <div className={styles.meshBackground}>
                    <div className={styles.meshOrb1} />
                    <div className={styles.meshOrb2} />
                    <div className={styles.meshOrb3} />
                </div>
                <Header showBack backHref="/booking" title="Your Information" />
                <main className={styles.main}>
                    <div className={styles.errorState}>
                        <div className={styles.errorIcon}>⚠️</div>
                        <h2 className={styles.errorTitle}>Missing Booking Details</h2>
                        <p className={styles.errorText}>Please select your service, date, and time first.</p>
                        <Button variant="primary" size="lg" onClick={() => router.push("/")}>
                            Start Booking
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only numbers
        const value = e.target.value.replace(/\D/g, '');

        // Limit to 11 digits (typical PH mobile format 09XXXXXXXXX)
        if (value.length <= 11) {
            setFormData({ ...formData, phone: value });
        }
    };

    // Phone validation helper for UI feedback
    const isPhoneValid = formData.phone.length === 11 && formData.phone.startsWith("09");

    return (
        <div className={styles.page}>
            {/* Rich Mesh Gradient Background */}
            <div className={styles.meshBackground}>
                <div className={styles.meshOrb1} />
                <div className={styles.meshOrb2} />
                <div className={styles.meshOrb3} />
            </div>

            <Header showBack backHref="#" onBackClick={handleBack} title="Your Information" />

            <main className={styles.main}>
                {/* Progress Indicator */}
                <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                        <div className={styles.progressStep}>
                            <div className={`${styles.stepCircle} ${styles.stepComplete}`}>✓</div>
                            <span className={styles.stepLabel}>Service</span>
                        </div>
                        <div className={styles.progressLine}></div>
                        <div className={styles.progressStep}>
                            <div className={`${styles.stepCircle} ${styles.stepComplete}`}>✓</div>
                            <span className={styles.stepLabel}>Schedule</span>
                        </div>
                        <div className={styles.progressLine}></div>
                        <div className={styles.progressStep}>
                            <div className={`${styles.stepCircle} ${styles.stepActive}`}>3</div>
                            <span className={styles.stepLabel}>Details</span>
                        </div>
                    </div>
                </div>

                {/* Booking Summary Card */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Booking Summary</h2>
                    <Card padding="md" className={styles.summaryCard}>
                        {selectedServices.map((service, index) => (
                            <div key={`${service.id}-${index}`} className={styles.summaryRow}>
                                <div
                                    className={styles.serviceImage}
                                    style={{
                                        backgroundImage: `url(${service.image})`,
                                        backgroundColor: "var(--color-neutral-200)"
                                    }}
                                />
                                <div className={styles.summaryDetails}>
                                    <h3 className={styles.serviceName}>{service.name}</h3>
                                    <p className={styles.serviceDuration}>{service.duration}</p>
                                </div>
                                <PriceTag amount={service.price} size="md" />
                            </div>
                        ))}
                        <div className={styles.divider}></div>
                        <div className={styles.scheduleInfo}>
                            <div className={styles.scheduleItem}>
                                <span className={styles.scheduleIcon}>📅</span>
                                <span className={styles.scheduleText}>
                                    {selectedDate ? formatDate(selectedDate) : "Date not selected"}
                                </span>
                            </div>
                            <div className={styles.scheduleItem}>
                                <span className={styles.scheduleIcon}>🕐</span>
                                <span className={styles.scheduleText}>{selectedTime || "Time not selected"}</span>
                            </div>
                        </div>
                    </Card>
                </section>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Honeypot field - hidden from users but bots will fill it */}
                    <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
                        <input
                            type="text"
                            name="website"
                            tabIndex={-1}
                            autoComplete="off"
                            value={honeypot}
                            onChange={(e) => setHoneypot(e.target.value)}
                        />
                    </div>

                    {/* Error Message */}
                    {submitError && (
                        <div className={styles.errorBanner}>
                            <span>⚠️</span> {submitError}
                        </div>
                    )}

                    {/* Contact Information */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Contact Details</h2>
                        <p className={styles.sectionDescription}>
                            Please provide your contact details so we can confirm your appointment.
                        </p>
                        <div className={styles.formFields}>
                            <Input
                                label="Full Name"
                                id="name"
                                type="text"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Phone Number"
                                id="phone"
                                type="tel"
                                placeholder="09XX XXX XXXX"
                                value={formData.phone}
                                onChange={handlePhoneChange}
                                required
                                maxLength={11}
                                error={formData.phone.length > 0 && !isPhoneValid ? "Must be 11 digits (09...)" : undefined}
                            />
                            <Input
                                label="Email (Optional)"
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            <TextArea
                                label="Special Requests (Optional)"
                                id="notes"
                                placeholder="Any allergies or preferences we should know?"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </section>

                    {/* Submit */}
                    <div className={styles.submitSection}>
                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>Total</span>
                            <PriceTag amount={total} size="lg" />
                        </div>
                        <div className={styles.buttonGroup}>
                            <Button
                                type="button"
                                variant="secondary"
                                size="lg"
                                onClick={handleBack}
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                loading={isSubmitting}
                                disabled={!formData.name || !isPhoneValid}
                                className={styles.confirmButton}
                            >
                                Confirm Booking
                            </Button>
                        </div>
                    </div>
                </form>

            </main>
        </div>
    );
}

export default function CustomerInfoPage() {
    return (
        <Suspense fallback={
            <div className={styles.page}>
                <Header showBack backHref="/booking" title="Your Information" />
                <main className={styles.main}>
                    <div className={styles.loading}>Loading...</div>
                </main>
            </div>
        }>
            <CustomerInfoContent />
        </Suspense>
    );
}
