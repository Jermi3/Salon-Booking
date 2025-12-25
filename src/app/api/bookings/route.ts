import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side


// In-memory rate limiting store (resets on server restart)
// For production, consider using Redis or a database
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_BOOKINGS_PER_IP = 3;
const MAX_PENDING_PER_PHONE = 2;

// Get client IP from request headers
function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    if (realIP) {
        return realIP;
    }
    return 'unknown';
}

// Check IP rate limit
function checkIPRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (!record || now > record.resetTime) {
        // Reset or create new record
        rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return { allowed: true, remaining: MAX_BOOKINGS_PER_IP - 1 };
    }

    if (record.count >= MAX_BOOKINGS_PER_IP) {
        return { allowed: false, remaining: 0 };
    }

    record.count++;
    return { allowed: true, remaining: MAX_BOOKINGS_PER_IP - record.count };
}

// Verify reCAPTCHA token with Google
async function verifyRecaptcha(token: string): Promise<{ success: boolean; score: number }> {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    // If no secret key configured, skip verification (for development)
    if (!secretKey) {
        console.warn('RECAPTCHA_SECRET_KEY not configured - skipping verification');
        return { success: true, score: 1.0 };
    }

    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${secretKey}&response=${token}`,
        });

        const data = await response.json();
        return {
            success: data.success && data.score >= 0.5,
            score: data.score || 0
        };
    } catch (error) {
        console.error('reCAPTCHA verification failed:', error);
        return { success: false, score: 0 };
    }
}

// Check pending bookings for phone number
async function checkPendingBookings(phone: string, supabase: any): Promise<number> {
    const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('customer_phone', phone)
        .eq('status', 'pending');

    if (error) {
        console.error('Error checking pending bookings:', error);
        return 0;
    }

    return count || 0;
}

export async function POST(request: NextRequest) {
    // Initialize Supabase client for server-side
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
        const body = await request.json();

        const {
            customerName,
            customerEmail,
            customerPhone,
            services,
            bookingDate,
            bookingTime,
            notes,
            totalPrice,
            recaptchaToken,
            honeypot, // Hidden field - should be empty
        } = body;

        // 1. Honeypot check - if filled, it's a bot
        if (honeypot) {
            // Silently reject but return success to confuse bots
            return NextResponse.json(
                { success: false, error: 'Booking failed. Please try again.' },
                { status: 400 }
            );
        }

        // 2. Basic validation
        if (!customerName || !customerPhone || !services || !bookingDate || !bookingTime) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields.' },
                { status: 400 }
            );
        }

        // Validate phone format (PH mobile: 09XXXXXXXXX)
        if (!/^09\d{9}$/.test(customerPhone)) {
            return NextResponse.json(
                { success: false, error: 'Invalid phone number format.' },
                { status: 400 }
            );
        }

        // 3. reCAPTCHA verification
        if (recaptchaToken) {
            const recaptchaResult = await verifyRecaptcha(recaptchaToken);
            if (!recaptchaResult.success) {
                return NextResponse.json(
                    { success: false, error: 'Security verification failed. Please refresh and try again.' },
                    { status: 400 }
                );
            }
        } else if (process.env.RECAPTCHA_SECRET_KEY) {
            // Token required if reCAPTCHA is configured
            return NextResponse.json(
                { success: false, error: 'Security verification required.' },
                { status: 400 }
            );
        }

        // 4. IP-based rate limiting
        const clientIP = getClientIP(request);
        const rateLimitResult = checkIPRateLimit(clientIP);

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Too many booking attempts. Please try again in an hour.',
                    retryAfter: 3600
                },
                { status: 429 }
            );
        }

        // 5. Phone-based pending booking limit
        const pendingCount = await checkPendingBookings(customerPhone, supabase);
        if (pendingCount >= MAX_PENDING_PER_PHONE) {
            return NextResponse.json(
                {
                    success: false,
                    error: `You already have ${pendingCount} pending booking(s). Please wait for confirmation before booking again.`
                },
                { status: 400 }
            );
        }

        // 6. All checks passed - create booking
        const { data, error } = await supabase
            .from('bookings')
            .insert({
                customer_name: customerName,
                customer_email: customerEmail || '',
                customer_phone: customerPhone,
                services: services,
                booking_date: bookingDate,
                booking_time: bookingTime,
                notes: notes || null,
                total_price: totalPrice,
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to create booking. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            booking: {
                id: data.id,
                status: data.status,
                createdAt: data.created_at,
            },
            remaining: rateLimitResult.remaining,
        });

    } catch (error) {
        console.error('Booking API error:', error);
        return NextResponse.json(
            { success: false, error: 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
}
