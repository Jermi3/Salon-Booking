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
