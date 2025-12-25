-- ============================================
-- Pa Reserve PH - Complete Database Setup
-- All SQL tables and configurations combined
-- Generated: 2025-12-26
-- ============================================

-- ============================================
-- SERVICES TABLE
-- ============================================

-- Create the services table
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT NOT NULL,
    price INTEGER NOT NULL,
    duration TEXT NOT NULL,
    image TEXT DEFAULT '',
    steps JSONB DEFAULT '[]'::jsonb,
    popular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);

-- Enable Row Level Security (RLS)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read services (public)
CREATE POLICY "Allow public read access" ON services
    FOR SELECT USING (true);

-- Policy: Allow anyone to insert services (for now - you can restrict later with auth)
CREATE POLICY "Allow public insert access" ON services
    FOR INSERT WITH CHECK (true);

-- Policy: Allow anyone to update services
CREATE POLICY "Allow public update access" ON services
    FOR UPDATE USING (true);

-- Policy: Allow anyone to delete services
CREATE POLICY "Allow public delete access" ON services
    FOR DELETE USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- BOOKINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    services JSONB NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    total_price INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Enable RLS for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies for bookings (public access for now)
CREATE POLICY "Allow public read bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Allow public insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update bookings" ON bookings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete bookings" ON bookings FOR DELETE USING (true);

-- Updated_at trigger for bookings
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    image TEXT,
    color TEXT DEFAULT '#E8B4B8',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies for categories
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete categories" ON categories FOR DELETE USING (true);

-- Updated_at trigger for categories
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SCHEDULE SETTINGS TABLE
-- Weekly schedule configuration for operating hours
-- ============================================

CREATE TABLE IF NOT EXISTS schedule_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),  -- 0=Sunday, 1=Monday, ... 6=Saturday
    is_open BOOLEAN DEFAULT true,
    open_time TIME NOT NULL DEFAULT '09:00:00',
    close_time TIME NOT NULL DEFAULT '18:00:00',
    slot_duration_minutes INTEGER DEFAULT 60 CHECK (slot_duration_minutes > 0),
    max_bookings_per_slot INTEGER DEFAULT 1 CHECK (max_bookings_per_slot > 0),
    break_start TIME,               -- Optional: lunch break start
    break_end TIME,                 -- Optional: lunch break end
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(day_of_week)
);

-- Enable RLS
ALTER TABLE schedule_settings ENABLE ROW LEVEL SECURITY;

-- Policies for schedule_settings (public read, admin write later)
CREATE POLICY "Allow public read schedule_settings" ON schedule_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert schedule_settings" ON schedule_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update schedule_settings" ON schedule_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete schedule_settings" ON schedule_settings FOR DELETE USING (true);

-- Updated_at trigger
CREATE TRIGGER update_schedule_settings_updated_at 
    BEFORE UPDATE ON schedule_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DEFAULT SCHEDULE
-- Default: Mon-Sat 9AM-6PM, Sunday closed
-- ============================================

INSERT INTO schedule_settings (day_of_week, is_open, open_time, close_time, slot_duration_minutes, max_bookings_per_slot, break_start, break_end)
VALUES 
    (0, false, '09:00:00', '18:00:00', 60, 1, NULL, NULL),       -- Sunday - CLOSED
    (1, true, '09:00:00', '18:00:00', 60, 1, '12:00:00', '13:00:00'),  -- Monday
    (2, true, '09:00:00', '18:00:00', 60, 1, '12:00:00', '13:00:00'),  -- Tuesday
    (3, true, '09:00:00', '18:00:00', 60, 1, '12:00:00', '13:00:00'),  -- Wednesday
    (4, true, '09:00:00', '18:00:00', 60, 1, '12:00:00', '13:00:00'),  -- Thursday
    (5, true, '09:00:00', '18:00:00', 60, 1, '12:00:00', '13:00:00'),  -- Friday
    (6, true, '09:00:00', '18:00:00', 60, 1, '12:00:00', '13:00:00')   -- Saturday
ON CONFLICT (day_of_week) DO NOTHING;

-- ============================================
-- SCHEDULE OVERRIDES TABLE
-- For holidays, special hours, and blocked dates
-- ============================================

CREATE TABLE IF NOT EXISTS schedule_overrides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    is_closed BOOLEAN DEFAULT false,
    open_time TIME,
    close_time TIME,
    max_bookings_per_slot INTEGER CHECK (max_bookings_per_slot IS NULL OR max_bookings_per_slot > 0),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE schedule_overrides ENABLE ROW LEVEL SECURITY;

-- Policies for schedule_overrides
CREATE POLICY "Allow public read schedule_overrides" ON schedule_overrides FOR SELECT USING (true);
CREATE POLICY "Allow public insert schedule_overrides" ON schedule_overrides FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update schedule_overrides" ON schedule_overrides FOR UPDATE USING (true);
CREATE POLICY "Allow public delete schedule_overrides" ON schedule_overrides FOR DELETE USING (true);

-- Updated_at trigger
CREATE TRIGGER update_schedule_overrides_updated_at 
    BEFORE UPDATE ON schedule_overrides 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster date lookups
CREATE INDEX IF NOT EXISTS idx_schedule_overrides_date ON schedule_overrides(date);
