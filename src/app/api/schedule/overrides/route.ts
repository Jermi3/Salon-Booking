import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/schedule/overrides - Get all overrides
export async function GET() {
    try {
        const { data: overrides, error } = await supabase
            .from('schedule_overrides')
            .select('*')
            .order('date', { ascending: true });

        if (error) {
            console.error('Error fetching overrides:', error);
            return NextResponse.json({ error: 'Failed to fetch overrides' }, { status: 500 });
        }

        return NextResponse.json({ overrides: overrides || [] });
    } catch (error) {
        console.error('Overrides API error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}

// POST /api/schedule/overrides - Create a new override
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { date, is_closed, open_time, close_time, max_bookings_per_slot, reason } = body;

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('schedule_overrides')
            .upsert({
                date,
                is_closed: is_closed || false,
                open_time: open_time || null,
                close_time: close_time || null,
                max_bookings_per_slot: max_bookings_per_slot || null,
                reason: reason || null,
            }, { onConflict: 'date' })
            .select()
            .single();

        if (error) {
            console.error('Error creating override:', error);
            return NextResponse.json({ error: 'Failed to create override' }, { status: 500 });
        }

        return NextResponse.json({ success: true, override: data });
    } catch (error) {
        console.error('Override create error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}

// DELETE /api/schedule/overrides?date=YYYY-MM-DD - Delete an override
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('schedule_overrides')
            .delete()
            .eq('date', date);

        if (error) {
            console.error('Error deleting override:', error);
            return NextResponse.json({ error: 'Failed to delete override' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Override delete error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
