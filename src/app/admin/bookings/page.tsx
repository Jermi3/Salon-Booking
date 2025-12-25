'use client';

import BookingTable from '@/components/admin/BookingTable';
import { useBookings, Booking } from '@/context/BookingsContext';
import styles from '../admin.module.css';

const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--charcoal-warm)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

export default function BookingsPage() {
    const { bookings, isLoading, updateBookingStatus, deleteBooking } = useBookings();

    const handleStatusChange = async (bookingId: string, status: Booking['status']) => {
        try {
            await updateBookingStatus(bookingId, status);
            // Show success feedback
            console.log(`Booking status updated to: ${status}`);
        } catch (error) {
            console.error('Failed to update booking status:', error);
            alert(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading bookings...</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className={styles.headerTitle} style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Bookings</h1>
                    <p className={styles.headerSubtitle} style={{ margin: 0 }}>Manage and view all customer appointments.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        style={buttonStyle}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                        Filter
                    </button>
                    <button
                        style={buttonStyle}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
                        </svg>
                        Export
                    </button>
                </div>
            </div>

            {bookings.length > 0 ? (
                <BookingTable
                    bookings={bookings}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                />
            ) : (
                <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    borderRadius: '1rem',
                    border: '1px solid rgba(255,255,255,0.6)',
                    color: 'var(--text-secondary)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                    <h3 style={{ marginBottom: '0.5rem', color: 'var(--charcoal-warm)' }}>No Bookings Yet</h3>
                    <p>Bookings will appear here once customers make appointments through the website.</p>
                </div>
            )}
        </div>
    );
}
