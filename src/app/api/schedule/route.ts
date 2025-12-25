import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types
interface ScheduleSetting {
    day_of_week: number;
    is_open: boolean;
    open_time: string;
    close_time: string;
    slot_duration_minutes: number;
    max_bookings_per_slot: number;
    break_start: string | null;
    break_end: string | null;
}

interface ScheduleOverride {
    date: string;
    is_closed: boolean;
    open_time: string | null;
    close_time: string | null;
    max_bookings_per_slot: number | null;
    reason: string | null;
}

interface TimeSlot {
    time: string;
    available: boolean;
    remainingSlots: number;
    maxSlots: number;
}

// Helper to parse time string "HH:MM:SS" to minutes since midnight
function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

// Helper to format minutes since midnight to display time "9:00 AM"
function minutesToDisplayTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMins = mins === 0 ? '' : `:${ mins.toString().padStart(2, '0') } `;
    return `${ displayHour }${ displayMins === '' ? ':00' : displayMins } ${ period } `;
}

// Generate time slots for a given schedule configuration
function generateTimeSlots(
    openTime: string,
    closeTime: string,
    slotDuration: number,
    breakStart: string | null,
    breakEnd: string | null
): string[] {
    const slots: string[] = [];
    const openMinutes = timeToMinutes(openTime);
    const closeMinutes = timeToMinutes(closeTime);
    const breakStartMinutes = breakStart ? timeToMinutes(breakStart) : null;
    const breakEndMinutes = breakEnd ? timeToMinutes(breakEnd) : null;

    for (let current = openMinutes; current < closeMinutes; current += slotDuration) {
        // Skip slots during break time
        if (breakStartMinutes !== null && breakEndMinutes !== null) {
            if (current >= breakStartMinutes && current < breakEndMinutes) {
                continue;
            }
        }
        slots.push(minutesToDisplayTime(current));
    }

    return slots;
}

// GET /api/schedule - Get schedule settings
// GET /api/schedule?date=YYYY-MM-DD - Get available slots for a specific date
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        // If no date specified, return full schedule settings
        if (!date) {
            const { data: settings, error } = await supabase
                .from('schedule_settings')
                .select('*')
                .order('day_of_week', { ascending: true });

            if (error) {
                console.error('Error fetching schedule settings:', error);
                return NextResponse.json({ error: 'Failed to fetch schedule settings' }, { status: 500 });
            }

            const { data: overrides } = await supabase
                .from('schedule_overrides')
                .select('*')
                .gte('date', new Date().toISOString().split('T')[0])
                .order('date', { ascending: true });

            return NextResponse.json({
                settings: settings || [],
                overrides: overrides || []
            });
        }

        // Get available slots for specific date
        // Parse date components to avoid timezone issues (new Date("YYYY-MM-DD") is interpreted as UTC)
        const [year, month, day] = date.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day); // month is 0-indexed
        const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // 1. Get schedule for this day of the week
        const { data: daySetting, error: dayError } = await supabase
            .from('schedule_settings')
            .select('*')
            .eq('day_of_week', dayOfWeek)
            .single();

        if (dayError || !daySetting) {
            return NextResponse.json({
                date,
                isOpen: false,
                reason: 'Schedule not configured',
                slots: []
            });
        }

        // 2. Check for date override
        const { data: override } = await supabase
            .from('schedule_overrides')
            .select('*')
            .eq('date', date)
            .single();

        // If there's an override that marks the day as closed
        if (override?.is_closed) {
            return NextResponse.json({
                date,
                isOpen: false,
                reason: override.reason || 'Closed',
                slots: []
            });
        }

        // If the regular schedule says closed and no override opens it
        if (!daySetting.is_open && !override) {
            return NextResponse.json({
                date,
                isOpen: false,
                reason: 'Closed',
                slots: []
            });
        }

        // 3. Determine effective schedule (override takes precedence)
        const effectiveOpenTime = override?.open_time || daySetting.open_time;
        const effectiveCloseTime = override?.close_time || daySetting.close_time;
        const effectiveMaxSlots = override?.max_bookings_per_slot || daySetting.max_bookings_per_slot;
        const slotDuration = daySetting.slot_duration_minutes;
        const breakStart = daySetting.break_start;
        const breakEnd = daySetting.break_end;

        // 4. Generate all possible time slots
        const allSlots = generateTimeSlots(
            effectiveOpenTime,
            effectiveCloseTime,
            slotDuration,
            breakStart,
            breakEnd
        );

        // 5. Get existing bookings for this date
        const { data: bookings } = await supabase
            .from('bookings')
            .select('booking_time')
            .eq('booking_date', date)
            .in('status', ['pending', 'confirmed']);

        // Count bookings per time slot
        const bookingCounts = new Map<string, number>();
        (bookings || []).forEach(booking => {
            const time = booking.booking_time;
            bookingCounts.set(time, (bookingCounts.get(time) || 0) + 1);
        });

        // 6. Build slot availability
        const slots: TimeSlot[] = allSlots.map(time => {
            const booked = bookingCounts.get(time) || 0;
            const remaining = Math.max(0, effectiveMaxSlots - booked);
            return {
                time,
                available: remaining > 0,
                remainingSlots: remaining,
                maxSlots: effectiveMaxSlots
            };
        });

        // 7. Filter out past times if date is today
        const now = new Date();
        const isToday = targetDate.toDateString() === now.toDateString();

        const filteredSlots = isToday
            ? slots.filter(slot => {
                // Parse slot time and compare to current time
                const [timePart, period] = slot.time.split(' ');
                const [hours, mins] = timePart.split(':').map(Number);
                let slotHour = hours;
                if (period === 'PM' && hours !== 12) slotHour += 12;
                if (period === 'AM' && hours === 12) slotHour = 0;

                const slotMinutes = slotHour * 60 + (mins || 0);
                const currentMinutes = now.getHours() * 60 + now.getMinutes();

                return slotMinutes > currentMinutes + 60; // At least 1 hour in advance
            })
            : slots;

        return NextResponse.json({
            date,
            isOpen: true,
            slots: filteredSlots,
            settings: {
                openTime: effectiveOpenTime,
                closeTime: effectiveCloseTime,
                slotDuration,
                maxBookingsPerSlot: effectiveMaxSlots
            }
        });

    } catch (error) {
        console.error('Schedule API error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}

// PUT /api/schedule - Update schedule settings
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { settings } = body;

        if (!settings || !Array.isArray(settings)) {
            return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 });
        }

        // Upsert each day's settings
        for (const setting of settings) {
            const { error } = await supabase
                .from('schedule_settings')
                .upsert({
                    day_of_week: setting.day_of_week,
                    is_open: setting.is_open,
                    open_time: setting.open_time,
                    close_time: setting.close_time,
                    slot_duration_minutes: setting.slot_duration_minutes,
                    max_bookings_per_slot: setting.max_bookings_per_slot,
                    break_start: setting.break_start || null,
                    break_end: setting.break_end || null,
                }, { onConflict: 'day_of_week' });

            if (error) {
                console.error('Error updating schedule setting:', error);
                return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Schedule update error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
