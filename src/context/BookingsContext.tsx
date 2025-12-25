'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

// Booking types
export interface BookingService {
    id: string;
    name: string;
    price: number;
    duration: string;
}

export interface Booking {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    services: BookingService[];
    bookingDate: string;
    bookingTime: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    notes?: string;
    totalPrice: number;
    createdAt: string;
}

interface BookingsContextType {
    bookings: Booking[];
    createBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) => Promise<Booking>;
    updateBookingStatus: (bookingId: string, status: Booking['status']) => Promise<void>;
    deleteBooking: (bookingId: string) => Promise<void>;
    getBookingById: (id: string) => Booking | null;
    isLoading: boolean;
    refreshBookings: () => Promise<void>;
}

const BookingsContext = createContext<BookingsContextType | undefined>(undefined);

export function BookingsProvider({ children }: { children: ReactNode }) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch bookings from Supabase
    const fetchBookings = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .order('booking_date', { ascending: false })
                .order('booking_time', { ascending: false });

            if (error) {
                console.error('Error fetching bookings:', error);
                return;
            }

            // Transform database records to Booking format
            const transformedBookings: Booking[] = (data || []).map((dbBooking) => ({
                id: dbBooking.id,
                customerName: dbBooking.customer_name,
                customerEmail: dbBooking.customer_email,
                customerPhone: dbBooking.customer_phone,
                services: dbBooking.services || [],
                bookingDate: dbBooking.booking_date,
                bookingTime: dbBooking.booking_time,
                status: dbBooking.status,
                notes: dbBooking.notes,
                totalPrice: dbBooking.total_price,
                createdAt: dbBooking.created_at,
            }));

            setBookings(transformedBookings);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        }
    }, []);

    // Load bookings on mount
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await fetchBookings();
            setIsLoading(false);
        };
        init();
    }, [fetchBookings]);

    // Create a new booking
    const createBooking = useCallback(async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> => {
        const { data, error } = await supabase
            .from('bookings')
            .insert({
                customer_name: bookingData.customerName,
                customer_email: bookingData.customerEmail,
                customer_phone: bookingData.customerPhone,
                services: bookingData.services,
                booking_date: bookingData.bookingDate,
                booking_time: bookingData.bookingTime,
                notes: bookingData.notes || null,
                total_price: bookingData.totalPrice,
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating booking:', error);
            throw error;
        }

        const newBooking: Booking = {
            id: data.id,
            customerName: data.customer_name,
            customerEmail: data.customer_email,
            customerPhone: data.customer_phone,
            services: data.services,
            bookingDate: data.booking_date,
            bookingTime: data.booking_time,
            status: data.status,
            notes: data.notes,
            totalPrice: data.total_price,
            createdAt: data.created_at,
        };

        setBookings(prev => [newBooking, ...prev]);
        return newBooking;
    }, []);

    // Update booking status
    const updateBookingStatus = useCallback(async (bookingId: string, status: Booking['status']) => {
        const { error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', bookingId);

        if (error) {
            console.error('Error updating booking status:', error);
            throw error;
        }

        setBookings(prev =>
            prev.map(booking =>
                booking.id === bookingId ? { ...booking, status } : booking
            )
        );
    }, []);

    // Delete a booking
    const deleteBooking = useCallback(async (bookingId: string) => {
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', bookingId);

        if (error) {
            console.error('Error deleting booking:', error);
            throw error;
        }

        setBookings(prev => prev.filter(booking => booking.id !== bookingId));
    }, []);

    // Get booking by ID
    const getBookingById = useCallback((id: string) => {
        return bookings.find(booking => booking.id === id) || null;
    }, [bookings]);

    // Refresh bookings
    const refreshBookings = useCallback(async () => {
        await fetchBookings();
    }, [fetchBookings]);

    return (
        <BookingsContext.Provider
            value={{
                bookings,
                createBooking,
                updateBookingStatus,
                deleteBooking,
                getBookingById,
                isLoading,
                refreshBookings,
            }}
        >
            {children}
        </BookingsContext.Provider>
    );
}

export function useBookings() {
    const context = useContext(BookingsContext);
    if (context === undefined) {
        throw new Error('useBookings must be used within a BookingsProvider');
    }
    return context;
}
