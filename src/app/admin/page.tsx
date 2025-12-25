'use client';

import { useState, useMemo, useEffect } from 'react';
import StatCard from '@/components/admin/StatCard';
import BookingTable from '@/components/admin/BookingTable';
import GlassModal from '@/components/ui/GlassModal';
import { useBookings, Booking } from '@/context/BookingsContext';
import styles from '@/app/admin/admin.module.css';

interface StatItem {
    id: string;
    title: string;
    value: string;
    trend: string;
    trendUp: boolean;
    details: {
        breakdown: { label: string; value: string }[];
        topPerfomers?: string[];
    };
}

export default function AdminDashboard() {
    const { bookings, isLoading, updateBookingStatus, deleteBooking, refreshBookings } = useBookings();
    const [selectedStat, setSelectedStat] = useState<StatItem | null>(null);

    // Refresh bookings when dashboard loads to ensure stats are up-to-date
    useEffect(() => {
        refreshBookings();
    }, [refreshBookings]);

    // Calculate stats from real bookings data
    const stats = useMemo(() => {
        const completedBookings = bookings.filter(b => b.status === 'completed');
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
        const pendingBookings = bookings.filter(b => b.status === 'pending');
        const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

        // Calculate total revenue from completed bookings
        const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);

        // Get unique customers (by email)
        const uniqueCustomers = new Set(bookings.map(b => b.customerEmail)).size;

        // Format currency
        const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;

        return [
            {
                id: 'revenue',
                title: 'Total Revenue',
                value: formatCurrency(totalRevenue),
                trend: '+0%',
                trendUp: true,
                details: {
                    breakdown: [
                        { label: 'Completed Bookings', value: formatCurrency(totalRevenue) },
                        { label: 'Confirmed (Pending Revenue)', value: formatCurrency(confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0)) },
                        { label: 'Pending (Potential)', value: formatCurrency(pendingBookings.reduce((sum, b) => sum + b.totalPrice, 0)) }
                    ],
                }
            },
            {
                id: 'appointments',
                title: 'Appointments',
                value: String(bookings.length),
                trend: '+0%',
                trendUp: true,
                details: {
                    breakdown: [
                        { label: 'Completed', value: String(completedBookings.length) },
                        { label: 'Confirmed', value: String(confirmedBookings.length) },
                        { label: 'Pending', value: String(pendingBookings.length) },
                        { label: 'Cancelled', value: String(cancelledBookings.length) }
                    ]
                }
            },
            {
                id: 'clients',
                title: 'Total Clients',
                value: String(uniqueCustomers),
                trend: '+0%',
                trendUp: true,
                details: {
                    breakdown: [
                        { label: 'Unique Customers', value: String(uniqueCustomers) },
                        { label: 'Total Bookings', value: String(bookings.length) }
                    ]
                }
            },
            {
                id: 'conversion',
                title: 'Completion Rate',
                value: bookings.length > 0 ? `${Math.round((completedBookings.length / bookings.length) * 100)}%` : '0%',
                trend: '+0%',
                trendUp: true,
                details: {
                    breakdown: [
                        { label: 'Completed', value: `${completedBookings.length} bookings` },
                        { label: 'Total', value: `${bookings.length} bookings` },
                        { label: 'Cancellation Rate', value: bookings.length > 0 ? `${Math.round((cancelledBookings.length / bookings.length) * 100)}%` : '0%' }
                    ]
                }
            },
        ];
    }, [bookings]);

    // Get recent bookings (last 5)
    const recentBookings: Booking[] = useMemo(() => {
        return bookings.slice(0, 5);
    }, [bookings]);

    const handleStatusChange = async (bookingId: string, status: Booking['status']) => {
        try {
            await updateBookingStatus(bookingId, status);
        } catch (error) {
            console.error('Failed to update booking status:', error);
        }
    };

    const handleDelete = async (bookingId: string) => {
        if (!confirm('Are you sure you want to delete this booking?')) return;
        try {
            await deleteBooking(bookingId);
        } catch (error) {
            console.error('Failed to delete booking:', error);
        }
    };

    // Download report as CSV
    const downloadReport = () => {
        if (bookings.length === 0) {
            alert('No bookings to export');
            return;
        }

        // CSV headers
        const headers = ['Customer Name', 'Phone', 'Email', 'Services', 'Date', 'Time', 'Status', 'Total (₱)', 'Notes'];

        // CSV rows
        const rows = bookings.map(b => [
            b.customerName,
            b.customerPhone,
            b.customerEmail || '',
            b.services.map(s => s.name).join('; '),
            b.bookingDate,
            b.bookingTime,
            b.status,
            b.totalPrice.toString(),
            b.notes || ''
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `bookings-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 className={styles.headerTitle}>Dashboard Overview</h1>
                        <p className={styles.headerSubtitle}>Welcome back, Admin. Here&apos;s what&apos;s happening today.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.6)', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(4px)' }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <button
                            onClick={downloadReport}
                            style={{ backgroundColor: 'var(--charcoal-warm)', color: 'var(--text-inverse)', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 500, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(45, 42, 38, 0.2)' }}
                        >
                            Download Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Interactive Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                width: '100%'
            }}>
                {stats.map((stat) => (
                    <StatCard
                        key={stat.id}
                        {...stat}
                        onClick={() => setSelectedStat(stat)}
                    />
                ))}
            </div>

            {/* Recent Bookings Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--charcoal-warm)' }}>Recent Bookings</h2>
                    <a href="/admin/bookings" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--terracotta-base)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        View all bookings &rarr;
                    </a>
                </div>
                {recentBookings.length > 0 ? (
                    <BookingTable
                        bookings={recentBookings}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                    />
                ) : (
                    <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        backgroundColor: 'rgba(255,255,255,0.5)',
                        borderRadius: '1rem',
                        border: '1px solid rgba(255,255,255,0.6)',
                        color: 'var(--text-secondary)'
                    }}>
                        No bookings yet. Bookings will appear here once customers make appointments.
                    </div>
                )}
            </div>

            {/* Stat Details Modal */}
            <GlassModal
                isOpen={!!selectedStat}
                onClose={() => setSelectedStat(null)}
                title={selectedStat?.title || ''}
            >
                {selectedStat && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                            <h3 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--charcoal-warm)', fontFamily: 'var(--font-serif)' }}>{selectedStat.value}</h3>
                            <span
                                className={`${styles.statTrend} ${selectedStat.trendUp ? styles.trendUp : styles.trendDown}`}
                            >
                                {selectedStat.trendUp ? '↑' : '↓'} {selectedStat.trend}
                            </span>
                        </div>

                        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.5)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.6)' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Performance Breakdown</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {selectedStat.details?.breakdown.map((item, index) => (
                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: index !== selectedStat.details.breakdown.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                                        <span style={{ color: 'var(--charcoal-warm)' }}>{item.label}</span>
                                        <span style={{ fontWeight: 600, color: 'var(--terracotta-base)' }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedStat.details?.topPerfomers && (
                            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.5)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.6)' }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Top Performers</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {selectedStat.details.topPerfomers.map((item, index) => (
                                        <span key={index} style={{ padding: '0.25rem 0.75rem', background: 'white', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '9999px', fontSize: '0.875rem', color: 'var(--charcoal-warm)' }}>
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            View full detailed report in the <a href="#" style={{ color: 'var(--terracotta-base)', fontWeight: 500 }}>Analytics</a> section.
                        </div>
                    </div>
                )}
            </GlassModal>
        </div>
    );
}
