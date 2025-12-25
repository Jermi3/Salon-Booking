"use client";

import React, { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Service, ServiceCategory } from "@/config/services.config";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PriceTag } from "@/components/ui/PriceTag";
import styles from "./page.module.css";

type ServiceWithCategory = Service & { categoryId: string; categoryName: string };

// Helper to fetch a service from database
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

// Fetch all services from database
async function getAllServices(): Promise<ServiceWithCategory[]> {
    const { data: services, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

    if (error || !services) return [];

    // Fetch all categories for mapping
    const { data: categories } = await supabase.from('categories').select('id, name');
    const categoryMap = new Map<string, string>();
    categories?.forEach(c => categoryMap.set(c.id, c.name));

    return services.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        shortDescription: s.short_description,
        price: s.price,
        duration: s.duration,
        image: s.image || '/images/placeholder-service.png',
        steps: s.steps || [],
        popular: s.popular,
        categoryId: s.category_id,
        categoryName: categoryMap.get(s.category_id) || 'Service',
    }));
}

// Fetch popular services from database
async function getPopularServices(): Promise<ServiceWithCategory[]> {
    const allServices = await getAllServices();
    return allServices.filter(s => s.popular);
}

// Fetch all categories from database
async function getAllCategories(): Promise<ServiceCategory[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error || !data) return [];

    return data.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || '',
        icon: cat.icon || '',
        image: cat.image || '',
        color: cat.color || '#E8B4B8',
        services: [],
    }));
}

function BookingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const servicesParam = searchParams.get("services");
    const serviceId = searchParams.get("service");
    const addServiceId = searchParams.get("addService"); // For adding new service

    // Changed to array for multiple services
    const [selectedServices, setSelectedServices] = useState<ServiceWithCategory[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isLoadingServices, setIsLoadingServices] = useState(true);

    // Dynamic time slots from schedule API
    interface TimeSlot {
        time: string;
        available: boolean;
        remainingSlots: number;
        maxSlots: number;
    }
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [dayIsClosed, setDayIsClosed] = useState(false);
    const [closedReason, setClosedReason] = useState<string | null>(null);

    // Track which days of the week are closed (0=Sunday, 6=Saturday)
    const [closedDaysOfWeek, setClosedDaysOfWeek] = useState<Set<number>>(new Set());

    // Service browser state
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [allServicesData, setAllServicesData] = useState<ServiceWithCategory[]>([]);
    const [categoriesData, setCategoriesData] = useState<ServiceCategory[]>([]);
    const [suggestions, setSuggestions] = useState<ServiceWithCategory[]>([]);

    // Sticky header state
    const [isSticky, setIsSticky] = useState(false);
    const heroCardRef = useRef<HTMLDivElement>(null);

    // Load categories and all services on mount
    useEffect(() => {
        const loadData = async () => {
            const [cats, allSvcs, popularSvcs] = await Promise.all([
                getAllCategories(),
                getAllServices(),
                getPopularServices(),
            ]);
            setCategoriesData(cats);
            setAllServicesData(allSvcs);
            setSuggestions(popularSvcs.slice(0, 4));
        };
        loadData();
    }, []);

    // Fetch weekly schedule to know which days are closed
    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const res = await fetch('/api/schedule');
                const data = await res.json();
                if (data.settings && Array.isArray(data.settings)) {
                    const closedDays = new Set<number>();
                    data.settings.forEach((s: { day_of_week: number; is_open: boolean }) => {
                        if (!s.is_open) {
                            closedDays.add(s.day_of_week);
                        }
                    });
                    setClosedDaysOfWeek(closedDays);
                }
            } catch (error) {
                console.error('Failed to fetch schedule:', error);
            }
        };
        fetchSchedule();
    }, []);

    // Handle initial service and adding services (async for database)
    useEffect(() => {
        const loadServices = async () => {
            setIsLoadingServices(true);
            const servicesToSet: ServiceWithCategory[] = [];
            const currentServiceIds = new Set<string>();

            // 1. Initialize from 'services' param (comma-separated list)
            if (servicesParam) {
                const ids = servicesParam.split(",");
                for (const id of ids) {
                    const service = await getServiceById(id);
                    if (service && !currentServiceIds.has(id)) {
                        servicesToSet.push(service);
                        currentServiceIds.add(id);
                    }
                }
            }
            // 2. Fallback to 'service' param if no 'services' list
            else if (serviceId) {
                const service = await getServiceById(serviceId);
                if (service && !currentServiceIds.has(serviceId)) {
                    servicesToSet.push(service);
                    currentServiceIds.add(serviceId);
                }
            }

            // 3. Handle 'addService' param
            if (addServiceId) {
                const serviceToAdd = await getServiceById(addServiceId);
                if (serviceToAdd && !currentServiceIds.has(addServiceId)) {
                    servicesToSet.push(serviceToAdd);
                    currentServiceIds.add(addServiceId);
                }
            }

            setSelectedServices(servicesToSet);
            setIsLoadingServices(false);

            // Clean up URL to canonical form ?services=id1,id2
            const canonicalServices = servicesToSet.map(s => s.id).join(",");
            if (canonicalServices && (addServiceId || !servicesParam || servicesParam !== canonicalServices)) {
                const params = new URLSearchParams(searchParams.toString());
                params.delete("addService");
                params.delete("service");
                params.set("services", canonicalServices);
                const newUrl = `/booking?${params.toString()}`;
                router.replace(newUrl, { scroll: false });
            }
        };

        loadServices();
    }, [serviceId, addServiceId, servicesParam, router, searchParams]);

    // Scroll detection for morphing effect
    const handleScroll = useCallback(() => {
        const scrollY = window.scrollY;
        const threshold = 100;
        setIsSticky(scrollY > threshold);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Get days of the week header
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Fetch available time slots when date changes
    useEffect(() => {
        if (!selectedDate) {
            setTimeSlots([]);
            setDayIsClosed(false);
            setClosedReason(null);
            return;
        }

        const fetchSlots = async () => {
            setIsLoadingSlots(true);
            setSelectedTime(null); // Reset time when date changes

            try {
                // Format date in local timezone (toISOString uses UTC which causes off-by-one day errors)
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                const res = await fetch(`/api/schedule?date=${dateStr}`);
                const data = await res.json();

                if (!data.isOpen) {
                    setDayIsClosed(true);
                    setClosedReason(data.reason || 'Closed');
                    setTimeSlots([]);
                } else {
                    setDayIsClosed(false);
                    setClosedReason(null);
                    setTimeSlots(data.slots || []);
                }
            } catch (error) {
                console.error('Failed to fetch slots:', error);
                setTimeSlots([]);
            } finally {
                setIsLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [selectedDate]);

    // Generate calendar grid for current month view
    const generateCalendarDays = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        const startingDayOfWeek = firstDay.getDay();

        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();

        const calendarDays: (Date | null)[] = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarDays.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= totalDays; day++) {
            calendarDays.push(new Date(year, month, day));
        }

        return calendarDays;
    };

    const calendarDays = generateCalendarDays();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if a date is selectable (not in the past and not a closed day)
    const isDateSelectable = (date: Date | null) => {
        if (!date) return false;
        const dateToCheck = new Date(date);
        dateToCheck.setHours(0, 0, 0, 0);
        // Check if not in past and not a closed day of week
        const isNotPast = dateToCheck > today;
        const isNotClosedDay = !closedDaysOfWeek.has(date.getDay());
        return isNotPast && isNotClosedDay;
    };

    // Navigate months
    const goToPreviousMonth = () => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        // Don't go before current month
        const currentDate = new Date();
        if (newMonth.getFullYear() > currentDate.getFullYear() ||
            (newMonth.getFullYear() === currentDate.getFullYear() && newMonth.getMonth() >= currentDate.getMonth())) {
            setCurrentMonth(newMonth);
        }
    };

    const goToNextMonth = () => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        // Limit to 3 months ahead
        const maxMonth = new Date();
        maxMonth.setMonth(maxMonth.getMonth() + 3);
        if (newMonth <= maxMonth) {
            setCurrentMonth(newMonth);
        }
    };

    // Check if can navigate
    const canGoPrevious = () => {
        const currentDate = new Date();
        return currentMonth.getFullYear() > currentDate.getFullYear() ||
            (currentMonth.getFullYear() === currentDate.getFullYear() && currentMonth.getMonth() > currentDate.getMonth());
    };

    const canGoNext = () => {
        const maxMonth = new Date();
        maxMonth.setMonth(maxMonth.getMonth() + 3);
        return currentMonth < maxMonth;
    };

    const handleContinue = () => {
        if (selectedServices.length === 0 || !selectedDate || !selectedTime) {
            return;
        }

        // Navigate to customer info page with selected booking details
        const params = new URLSearchParams();
        // Pass all service IDs as comma-separated
        params.set("services", selectedServices.map(s => s.id).join(","));
        // Format date in local timezone (toISOString uses UTC which causes off-by-one day errors)
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        params.set("date", `${year}-${month}-${day}`);
        params.set("time", encodeURIComponent(selectedTime));

        router.push(`/customer-info?${params.toString()}`);
    };

    // Remove a service from the booking
    const removeService = (serviceIdToRemove: string) => {
        const newServices = selectedServices.filter(s => s.id !== serviceIdToRemove);
        setSelectedServices(newServices);

        // Update URL to reflect removal
        const params = new URLSearchParams(searchParams.toString());
        if (newServices.length > 0) {
            params.set("services", newServices.map(s => s.id).join(","));
        } else {
            params.delete("services");
        }
        router.replace(`/booking?${params.toString()}`, { scroll: false });
    };

    // Get selected service IDs for filtering suggestions
    const selectedServiceIds = selectedServices.map(s => s.id);
    const filteredSuggestions = suggestions.filter(s => !selectedServiceIds.includes(s.id)).slice(0, 4);

    // Calculate total from all services
    const total = selectedServices.reduce((sum, s) => sum + s.price, 0);

    const backHref = serviceId ? `/service/${serviceId}` : "/";

    return (
        <div className={styles.page}>
            {/* Rich Mesh Gradient Background */}
            <div className={styles.meshBackground}>
                <div className={styles.meshOrb1} />
                <div className={styles.meshOrb2} />
                <div className={styles.meshOrb3} />
            </div>

            {/* Morphing Hero Card */}
            <div
                ref={heroCardRef}
                className={`${styles.heroCard} ${isSticky ? styles.sticky : ''}`}
            >
                {/* Sticky state back button */}
                {isSticky && (
                    <Link href={backHref} className={styles.backButton} aria-label="Go back">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5" />
                            <path d="m12 19-7-7 7-7" />
                        </svg>
                    </Link>
                )}

                <div className={styles.heroContent}>
                    {/* Title Row with back button and title */}
                    <div className={styles.titleRow}>
                        <Link href={backHref} className={styles.backButton} aria-label="Go back">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5" />
                                <path d="m12 19-7-7 7-7" />
                            </svg>
                        </Link>
                        <h1 className={styles.heroTitle}>Book Appointment</h1>
                    </div>

                    {/* Progress Steps - integrated into hero card */}
                    <div className={styles.progressSteps}>
                        <div className={styles.progressStep}>
                            <div className={`${styles.stepCircle} ${selectedServices.length > 0 ? styles.stepActive : ''}`}>1</div>
                            <span className={styles.stepLabel}>Service</span>
                        </div>
                        <div className={styles.progressLine}></div>
                        <div className={styles.progressStep}>
                            <div className={`${styles.stepCircle} ${selectedDate && selectedTime ? styles.stepActive : ''}`}>2</div>
                            <span className={styles.stepLabel}>Schedule</span>
                        </div>
                        <div className={styles.progressLine}></div>
                        <div className={styles.progressStep}>
                            <div className={styles.stepCircle}>3</div>
                            <span className={styles.stepLabel}>Details</span>
                        </div>
                    </div>
                </div >
            </div >

            <main className={styles.main}>

                <div className={styles.form}>
                    {/* Selected Services */}
                    {selectedServices.length > 0 && (
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                Your {selectedServices.length > 1 ? 'Services' : 'Service'}
                                {selectedServices.length > 1 && <span className={styles.serviceCount}>({selectedServices.length})</span>}
                            </h2>
                            <div className={styles.servicesStack}>
                                {selectedServices.map((service) => (
                                    <Card key={service.id} padding="md" className={styles.serviceCard}>
                                        <div className={styles.serviceInfo}>
                                            <div
                                                className={styles.serviceImage}
                                                style={{
                                                    backgroundImage: `url(${service.image})`,
                                                    backgroundColor: "var(--color-neutral-200)"
                                                }}
                                            />
                                            <div className={styles.serviceDetails}>
                                                <h3 className={styles.serviceName}>{service.name}</h3>
                                                <p className={styles.serviceDuration}>{service.duration}</p>
                                            </div>
                                            <PriceTag amount={service.price} size="md" />
                                            {selectedServices.length > 1 && (
                                                <button
                                                    type="button"
                                                    className={styles.removeServiceBtn}
                                                    onClick={() => removeService(service.id)}
                                                    aria-label={`Remove ${service.name}`}
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Collapsible Service Browser */}
                    <section className={styles.suggestionsSection}>
                        {/* Header with expand/collapse toggle */}
                        <button
                            type="button"
                            className={styles.suggestionsHeader}
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <h2 className={styles.sectionTitle}>Add More Services</h2>
                            <span className={`${styles.expandIcon} ${isExpanded ? styles.expandIconRotated : ''}`}>
                                ▼
                            </span>
                        </button>

                        {/* Preview - always shows 3 popular services */}
                        {!isExpanded && (
                            <>
                                <p className={styles.suggestionsSubtitle}>
                                    Tap to explore all our services
                                </p>
                                <div className={styles.suggestionsGrid}>
                                    {filteredSuggestions.slice(0, 4).map((service) => (
                                        <button
                                            key={service.id}
                                            type="button"
                                            className={styles.suggestionCard}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const currentIds = selectedServices.map(s => s.id).join(",");
                                                router.push(`/service/${service.id}?from=booking&currentServices=${currentIds}`);
                                            }}
                                        >
                                            <div
                                                className={styles.suggestionImage}
                                                style={{
                                                    backgroundImage: `url(${service.image})`,
                                                }}
                                            >
                                                <span className={styles.suggestionBadge}>Popular</span>
                                            </div>
                                            <div className={styles.suggestionContent}>
                                                <h3 className={styles.suggestionName}>{service.name}</h3>
                                                <div className={styles.suggestionMeta}>
                                                    <span className={styles.suggestionDuration}>{service.duration}</span>
                                                    <span className={styles.suggestionPrice}>₱{service.price.toLocaleString()}</span>
                                                </div>
                                                <span className={styles.suggestionAdd}>+ Add to Booking</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Expanded view with category tabs */}
                        {isExpanded && (
                            <>
                                {/* Category Tabs */}
                                <div className={styles.categoryTabs}>
                                    <button
                                        type="button"
                                        className={`${styles.categoryTab} ${selectedCategory === "all" ? styles.categoryTabActive : ''}`}
                                        onClick={() => setSelectedCategory("all")}
                                    >
                                        All
                                    </button>
                                    {categoriesData.map((category) => (
                                        <button
                                            key={category.id}
                                            type="button"
                                            className={`${styles.categoryTab} ${selectedCategory === category.id ? styles.categoryTabActive : ''}`}
                                            onClick={() => setSelectedCategory(category.id)}
                                        >
                                            {category.name}
                                        </button>
                                    ))}
                                </div>

                                {/* Filtered Services Grid */}
                                <div className={styles.suggestionsGridExpanded}>
                                    {(selectedCategory === "all"
                                        ? allServicesData
                                        : allServicesData.filter(s => s.categoryId === selectedCategory)
                                    )
                                        .filter(s => !selectedServices.some(sel => sel.id === s.id)) // Exclude all selected services
                                        .map((service) => (
                                            <button
                                                key={service.id}
                                                type="button"
                                                className={styles.suggestionCard}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const currentIds = selectedServices.map(s => s.id).join(",");
                                                    router.push(`/service/${service.id}?from=booking&currentServices=${currentIds}`);
                                                }}
                                            >
                                                <div
                                                    className={styles.suggestionImage}
                                                    style={{
                                                        backgroundImage: `url(${service.image})`,
                                                    }}
                                                >
                                                    {service.popular && <span className={styles.suggestionBadge}>Popular</span>}
                                                </div>
                                                <div className={styles.suggestionContent}>
                                                    <h3 className={styles.suggestionName}>{service.name}</h3>
                                                    <span className={styles.suggestionCategory}>{service.categoryName}</span>
                                                    <div className={styles.suggestionMeta}>
                                                        <span className={styles.suggestionDuration}>{service.duration}</span>
                                                        <span className={styles.suggestionPrice}>₱{service.price.toLocaleString()}</span>
                                                    </div>
                                                    <span className={styles.suggestionAdd}>+ Add to Booking</span>
                                                </div>
                                            </button>
                                        ))}
                                </div>


                            </>
                        )}
                    </section>

                    {/* Date Selection - Calendar */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Select Date</h2>
                        <div className={styles.calendarContainer}>
                            {/* Month Header */}
                            <div className={styles.calendarHeader}>
                                <button
                                    type="button"
                                    className={`${styles.calendarNav} ${!canGoPrevious() ? styles.calendarNavDisabled : ''}`}
                                    onClick={goToPreviousMonth}
                                    disabled={!canGoPrevious()}
                                >
                                    ‹
                                </button>
                                <span className={styles.calendarMonth}>
                                    {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </span>
                                <button
                                    type="button"
                                    className={`${styles.calendarNav} ${!canGoNext() ? styles.calendarNavDisabled : ''}`}
                                    onClick={goToNextMonth}
                                    disabled={!canGoNext()}
                                >
                                    ›
                                </button>
                            </div>

                            {/* Days of Week Header */}
                            <div className={styles.calendarWeekHeader}>
                                {daysOfWeek.map((day) => (
                                    <span key={day} className={`${styles.calendarWeekDay} ${day === "Sun" ? styles.sundayLabel : ''}`}>
                                        {day}
                                    </span>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className={styles.calendarGrid}>
                                {calendarDays.map((date, index) => {
                                    const isClosed = date && closedDaysOfWeek.has(date.getDay());
                                    const isPast = date && (() => {
                                        const dateToCheck = new Date(date);
                                        dateToCheck.setHours(0, 0, 0, 0);
                                        return dateToCheck <= today;
                                    })();
                                    const isSelectable = date && !isPast && !isClosed;

                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            className={`${styles.calendarDay} 
                                                ${!date ? styles.calendarDayEmpty : ''} 
                                                ${date && !isSelectable ? styles.calendarDayDisabled : ''} 
                                                ${date && isClosed && !isPast ? styles.calendarDayClosed : ''}
                                                ${date && selectedDate?.toDateString() === date.toDateString() ? styles.calendarDaySelected : ''}
                                                ${date?.getDay() === 0 ? styles.calendarDaySunday : ''}`}
                                            onClick={() => date && isSelectable && setSelectedDate(date)}
                                            disabled={!date || !isSelectable}
                                        >
                                            <span>{date?.getDate()}</span>
                                            {date && isClosed && !isPast && (
                                                <span className={styles.calendarDayLabel}>Closed</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* Time Selection */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Select Time</h2>

                        {/* Show message if no date selected */}
                        {!selectedDate && (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem', fontSize: '0.875rem' }}>
                                Please select a date first
                            </p>
                        )}

                        {/* Loading state */}
                        {selectedDate && isLoadingSlots && (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem', fontSize: '0.875rem' }}>
                                Loading available slots...
                            </p>
                        )}

                        {/* Day is closed message */}
                        {selectedDate && !isLoadingSlots && dayIsClosed && (
                            <div style={{
                                textAlign: 'center',
                                padding: '1.5rem',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '0.75rem',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}>
                                <p style={{ margin: 0, color: '#dc2626', fontWeight: 500 }}>
                                    {closedReason || 'Closed on this day'}
                                </p>
                                <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    Please select a different date
                                </p>
                            </div>
                        )}

                        {/* No slots available */}
                        {selectedDate && !isLoadingSlots && !dayIsClosed && timeSlots.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem', fontSize: '0.875rem' }}>
                                No time slots available for this date
                            </p>
                        )}

                        {/* Time slots grid */}
                        {selectedDate && !isLoadingSlots && !dayIsClosed && timeSlots.length > 0 && (
                            <div className={styles.timeGrid}>
                                {timeSlots.map((slot) => (
                                    <button
                                        key={slot.time}
                                        type="button"
                                        className={`${styles.timeButton} ${selectedTime === slot.time ? styles.timeSelected : ""} ${!slot.available ? styles.timeDisabled : ""}`}
                                        onClick={() => slot.available && setSelectedTime(slot.time)}
                                        disabled={!slot.available}
                                        style={{
                                            opacity: slot.available ? 1 : 0.5,
                                            cursor: slot.available ? 'pointer' : 'not-allowed',
                                            position: 'relative',
                                        }}
                                    >
                                        {slot.time}
                                        {!slot.available && (
                                            <span style={{
                                                display: 'block',
                                                fontSize: '0.65rem',
                                                color: 'var(--text-secondary)',
                                                marginTop: '0.125rem',
                                            }}>
                                                Full
                                            </span>
                                        )}
                                        {slot.available && slot.maxSlots > 1 && slot.remainingSlots <= 2 && (
                                            <span style={{
                                                display: 'block',
                                                fontSize: '0.65rem',
                                                color: 'var(--terracotta-base)',
                                                marginTop: '0.125rem',
                                            }}>
                                                {slot.remainingSlots} left
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>


                    {/* Submit */}
                    <div className={styles.submitSection}>
                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>Total</span>
                            <PriceTag amount={total} size="lg" />
                        </div>
                        <Button
                            type="button"
                            variant="primary"
                            size="lg"
                            fullWidth
                            disabled={selectedServices.length === 0 || !selectedDate || !selectedTime}
                            onClick={handleContinue}
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </main >
        </div >
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={
            <div className={styles.page}>
                <div className={styles.meshBackground}>
                    <div className={styles.meshOrb1} />
                    <div className={styles.meshOrb2} />
                    <div className={styles.meshOrb3} />
                </div>
                <div className={styles.heroCard}>
                    <div className={styles.heroContent}>
                        <div className={styles.titleRow}>
                            <div className={styles.backButton}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 12H5" />
                                    <path d="m12 19-7-7 7-7" />
                                </svg>
                            </div>
                            <h1 className={styles.heroTitle}>Book Appointment</h1>
                        </div>
                    </div>
                </div>
                <main className={styles.main}>
                    <div className={styles.loading}>Loading...</div>
                </main>
            </div>
        }>
            <BookingContent />
        </Suspense>
    );
}
