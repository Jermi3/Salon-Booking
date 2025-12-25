'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '@/app/admin/admin.module.css';

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
    id: string;
    date: string;
    is_closed: boolean;
    open_time: string | null;
    close_time: string | null;
    max_bookings_per_slot: number | null;
    reason: string | null;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Convert 24h time to 12h format for display
function formatTime12h(time24: string): string {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

export default function SchedulePage() {
    const [settings, setSettings] = useState<ScheduleSetting[]>([]);
    const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Override modal state
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [overrideDate, setOverrideDate] = useState('');
    const [overrideIsClosed, setOverrideIsClosed] = useState(true);
    const [overrideReason, setOverrideReason] = useState('');

    // Fetch schedule data
    const fetchSchedule = useCallback(async () => {
        try {
            const res = await fetch('/api/schedule');
            const data = await res.json();

            if (data.settings) {
                // Ensure we have all 7 days, fill in defaults if missing
                const fullSettings: ScheduleSetting[] = [];
                for (let i = 0; i < 7; i++) {
                    const existing = data.settings.find((s: ScheduleSetting) => s.day_of_week === i);
                    fullSettings.push(existing || {
                        day_of_week: i,
                        is_open: i !== 0, // Sunday closed by default
                        open_time: '09:00:00',
                        close_time: '18:00:00',
                        slot_duration_minutes: 60,
                        max_bookings_per_slot: 1,
                        break_start: '12:00:00',
                        break_end: '13:00:00',
                    });
                }
                setSettings(fullSettings);
            }

            if (data.overrides) {
                setOverrides(data.overrides);
            }
        } catch (error) {
            console.error('Failed to fetch schedule:', error);
            setMessage({ type: 'error', text: 'Failed to load schedule settings' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    // Update a day's setting locally
    const updateDaySetting = (dayIndex: number, field: keyof ScheduleSetting, value: string | number | boolean) => {
        setSettings(prev => prev.map(s =>
            s.day_of_week === dayIndex ? { ...s, [field]: value } : s
        ));
    };

    // Save all settings
    const handleSaveSettings = async () => {
        setIsSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/schedule', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Schedule settings saved successfully!' });
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Save error:', error);
            setMessage({ type: 'error', text: 'Failed to save schedule settings' });
        } finally {
            setIsSaving(false);
        }
    };

    // Add override (holiday/special day)
    const handleAddOverride = async () => {
        if (!overrideDate) return;

        try {
            const res = await fetch('/api/schedule/overrides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: overrideDate,
                    is_closed: overrideIsClosed,
                    reason: overrideReason || null,
                }),
            });

            if (res.ok) {
                await fetchSchedule();
                setShowOverrideModal(false);
                setOverrideDate('');
                setOverrideReason('');
                setMessage({ type: 'success', text: 'Holiday/special day added!' });
            } else {
                throw new Error('Failed to add override');
            }
        } catch (error) {
            console.error('Override error:', error);
            setMessage({ type: 'error', text: 'Failed to add holiday/special day' });
        }
    };

    // Delete override
    const handleDeleteOverride = async (date: string) => {
        if (!confirm('Remove this holiday/special day?')) return;

        try {
            const res = await fetch(`/api/schedule/overrides?date=${date}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setOverrides(prev => prev.filter(o => o.date !== date));
                setMessage({ type: 'success', text: 'Holiday removed!' });
            }
        } catch (error) {
            console.error('Delete error:', error);
            setMessage({ type: 'error', text: 'Failed to remove holiday' });
        }
    };

    if (isLoading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading schedule settings...
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className={styles.headerTitle}>Schedule Settings</h1>
                    <p className={styles.headerSubtitle}>Configure your operating hours and booking availability</p>
                </div>
                <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    style={{
                        backgroundColor: 'var(--charcoal-warm)',
                        color: 'var(--text-inverse)',
                        padding: '0.5rem 1.25rem',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        border: 'none',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        opacity: isSaving ? 0.6 : 1,
                    }}
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Message */}
            {message && (
                <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? '#16a34a' : '#dc2626',
                    border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}>
                    {message.text}
                </div>
            )}

            {/* Weekly Schedule */}
            <div style={{
                background: 'rgba(255,255,255,0.6)',
                borderRadius: '1rem',
                border: '1px solid rgba(255,255,255,0.7)',
                backdropFilter: 'blur(10px)',
                overflow: 'hidden',
            }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--charcoal-warm)' }}>Weekly Schedule</h2>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Set your regular operating hours for each day</p>
                </div>

                <div style={{ padding: '1rem' }}>
                    {settings.map((day) => (
                        <div
                            key={day.day_of_week}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '120px auto 1fr',
                                gap: '1rem',
                                alignItems: 'center',
                                padding: '0.75rem 0',
                                borderBottom: day.day_of_week < 6 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                            }}
                        >
                            {/* Day name */}
                            <span style={{ fontWeight: 600, color: 'var(--charcoal-warm)' }}>{DAY_NAMES[day.day_of_week]}</span>

                            {/* Open/Closed toggle */}
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                            }}>
                                <input
                                    type="checkbox"
                                    checked={day.is_open}
                                    onChange={(e) => updateDaySetting(day.day_of_week, 'is_open', e.target.checked)}
                                    style={{ width: '1rem', height: '1rem', accentColor: 'var(--terracotta-base)' }}
                                />
                                <span style={{ fontSize: '0.875rem', color: day.is_open ? 'var(--terracotta-base)' : 'var(--text-secondary)' }}>
                                    {day.is_open ? 'Open' : 'Closed'}
                                </span>
                            </label>

                            {/* Time inputs */}
                            {day.is_open ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        <input
                                            type="time"
                                            value={day.open_time.slice(0, 5)}
                                            onChange={(e) => updateDaySetting(day.day_of_week, 'open_time', e.target.value + ':00')}
                                            style={{
                                                padding: '0.375rem 0.5rem',
                                                border: '1px solid rgba(0,0,0,0.1)',
                                                borderRadius: '0.375rem',
                                                fontSize: '0.875rem',
                                                backgroundColor: 'white',
                                            }}
                                        />
                                        <span style={{ color: 'var(--text-secondary)' }}>to</span>
                                        <input
                                            type="time"
                                            value={day.close_time.slice(0, 5)}
                                            onChange={(e) => updateDaySetting(day.day_of_week, 'close_time', e.target.value + ':00')}
                                            style={{
                                                padding: '0.375rem 0.5rem',
                                                border: '1px solid rgba(0,0,0,0.1)',
                                                borderRadius: '0.375rem',
                                                fontSize: '0.875rem',
                                                backgroundColor: 'white',
                                            }}
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        (Break: {day.break_start ? formatTime12h(day.break_start) : 'None'} - {day.break_end ? formatTime12h(day.break_end) : 'None'})
                                    </span>
                                </div>
                            ) : (
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>—</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Global Settings */}
            <div style={{
                background: 'rgba(255,255,255,0.6)',
                borderRadius: '1rem',
                border: '1px solid rgba(255,255,255,0.7)',
                backdropFilter: 'blur(10px)',
                padding: '1.25rem',
            }}>
                <h2 style={{ margin: '0 0 1rem', fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--charcoal-warm)' }}>Booking Settings</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--charcoal-warm)', marginBottom: '0.5rem' }}>
                            Slot Duration (minutes)
                        </label>
                        <select
                            value={settings[1]?.slot_duration_minutes || 60}
                            onChange={(e) => {
                                const value = parseInt(e.target.value);
                                setSettings(prev => prev.map(s => ({ ...s, slot_duration_minutes: value })));
                            }}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid rgba(0,0,0,0.1)',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                backgroundColor: 'white',
                            }}
                        >
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={90}>1.5 hours</option>
                            <option value={120}>2 hours</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--charcoal-warm)', marginBottom: '0.5rem' }}>
                            Max Bookings per Slot
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={settings[1]?.max_bookings_per_slot || 1}
                            onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                setSettings(prev => prev.map(s => ({ ...s, max_bookings_per_slot: value })));
                            }}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid rgba(0,0,0,0.1)',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                backgroundColor: 'white',
                            }}
                        />
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Number of simultaneous appointments allowed per time slot
                        </p>
                    </div>

                    {/* Break Time Settings */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--charcoal-warm)', marginBottom: '0.5rem' }}>
                            Break Time
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="time"
                                value={settings[1]?.break_start?.slice(0, 5) || '12:00'}
                                onChange={(e) => {
                                    const value = e.target.value + ':00';
                                    setSettings(prev => prev.map(s => ({ ...s, break_start: value })));
                                }}
                                style={{
                                    padding: '0.5rem',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    backgroundColor: 'white',
                                }}
                            />
                            <span style={{ color: 'var(--text-secondary)' }}>to</span>
                            <input
                                type="time"
                                value={settings[1]?.break_end?.slice(0, 5) || '13:00'}
                                onChange={(e) => {
                                    const value = e.target.value + ':00';
                                    setSettings(prev => prev.map(s => ({ ...s, break_end: value })));
                                }}
                                style={{
                                    padding: '0.5rem',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    backgroundColor: 'white',
                                }}
                            />
                        </div>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            No bookings will be available during this time (e.g., lunch break)
                        </p>
                    </div>

                    {/* Option to disable break */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={!settings[1]?.break_start}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSettings(prev => prev.map(s => ({ ...s, break_start: null, break_end: null })));
                                    } else {
                                        setSettings(prev => prev.map(s => ({ ...s, break_start: '12:00:00', break_end: '13:00:00' })));
                                    }
                                }}
                                style={{ width: '1rem', height: '1rem', accentColor: 'var(--terracotta-base)' }}
                            />
                            <span style={{ fontSize: '0.875rem', color: 'var(--charcoal-warm)' }}>No break time (work continuously)</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Holidays & Special Days */}
            <div style={{
                background: 'rgba(255,255,255,0.6)',
                borderRadius: '1rem',
                border: '1px solid rgba(255,255,255,0.7)',
                backdropFilter: 'blur(10px)',
                padding: '1.25rem',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--charcoal-warm)' }}>Holidays & Special Days</h2>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Block specific dates or set special hours</p>
                    </div>
                    <button
                        onClick={() => setShowOverrideModal(true)}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'var(--terracotta-base)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        + Add Holiday
                    </button>
                </div>

                {overrides.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>
                        No holidays or special days configured
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {overrides.map((override) => (
                            <div
                                key={override.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.75rem 1rem',
                                    backgroundColor: 'rgba(255,255,255,0.5)',
                                    borderRadius: '0.5rem',
                                    border: '1px solid rgba(0,0,0,0.05)',
                                }}
                            >
                                <div>
                                    <span style={{ fontWeight: 600, color: 'var(--charcoal-warm)' }}>
                                        {new Date(override.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    {override.reason && (
                                        <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            — {override.reason}
                                        </span>
                                    )}
                                    {override.is_closed && (
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            padding: '0.125rem 0.5rem',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            color: '#dc2626',
                                            fontSize: '0.75rem',
                                            borderRadius: '9999px',
                                        }}>
                                            Closed
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDeleteOverride(override.date)}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        backgroundColor: 'transparent',
                                        color: '#dc2626',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Override Modal */}
            {showOverrideModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100,
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        maxWidth: '400px',
                        width: '90%',
                    }}>
                        <h3 style={{ margin: '0 0 1rem', fontFamily: 'var(--font-serif)', color: 'var(--charcoal-warm)' }}>Add Holiday / Special Day</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>Date</label>
                                <input
                                    type="date"
                                    value={overrideDate}
                                    onChange={(e) => setOverrideDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                    }}
                                />
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={overrideIsClosed}
                                    onChange={(e) => setOverrideIsClosed(e.target.checked)}
                                    style={{ width: '1rem', height: '1rem', accentColor: 'var(--terracotta-base)' }}
                                />
                                <span style={{ fontSize: '0.875rem' }}>Closed this day</span>
                            </label>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>Reason (optional)</label>
                                <input
                                    type="text"
                                    value={overrideReason}
                                    onChange={(e) => setOverrideReason(e.target.value)}
                                    placeholder="e.g., Christmas, Staff Training"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button
                                onClick={() => setShowOverrideModal(false)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'transparent',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddOverride}
                                disabled={!overrideDate}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'var(--terracotta-base)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: overrideDate ? 'pointer' : 'not-allowed',
                                    opacity: overrideDate ? 1 : 0.5,
                                }}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
