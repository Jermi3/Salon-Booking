'use client';

import { useState } from 'react';
import { Booking } from '@/context/BookingsContext';
import styles from '@/app/admin/admin.module.css';

interface BookingTableProps {
    bookings: Booking[];
    onStatusChange?: (bookingId: string, status: Booking['status']) => void;
    onDelete?: (bookingId: string) => void;
}

export default function BookingTable({ bookings, onStatusChange, onDelete }: BookingTableProps) {
    const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

    const getStatusStyle = (status: Booking['status']) => {
        switch (status) {
            case 'confirmed':
                return { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#16a34a' };
            case 'pending':
                return { backgroundColor: '#FEF9C3', color: '#854D0E' };
            case 'completed':
                return { backgroundColor: '#DBEAFE', color: '#1E40AF' };
            case 'cancelled':
                return { backgroundColor: '#FEE2E2', color: '#991B1B' };
            default:
                return { backgroundColor: '#F3F4F6', color: '#374151' };
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getServiceNames = (services: Booking['services']) => {
        if (services.length === 0) return 'No services';
        if (services.length === 1) return services[0].name;
        return `${services[0].name} +${services.length - 1} more`;
    };

    const toggleExpand = (bookingId: string) => {
        setExpandedBooking(prev => prev === bookingId ? null : bookingId);
    };

    if (bookings.length === 0) {
        return (
            <div className={styles.tableContainer} style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--bronze-light)' }}>No bookings yet</p>
            </div>
        );
    }

    return (
        <div className={styles.tableContainer}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead className={styles.tableHeader}>
                        <tr>
                            <th className={styles.tableHeaderCell}>Customer</th>
                            <th className={styles.tableHeaderCell}>Contact</th>
                            <th className={styles.tableHeaderCell}>Services</th>
                            <th className={styles.tableHeaderCell}>Date & Time</th>
                            <th className={styles.tableHeaderCell}>Total</th>
                            <th className={styles.tableHeaderCell}>Status</th>
                            <th className={styles.tableHeaderCell}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => {
                            const isExpanded = expandedBooking === booking.id;
                            const hasNotes = booking.notes && booking.notes.trim() !== '';
                            const hasEmail = booking.customerEmail && booking.customerEmail.trim() !== '';

                            return (
                                <>
                                    <tr key={booking.id} className={styles.tableRow}>
                                        <td className={styles.tableCell}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 500, color: 'var(--charcoal-warm)' }}>{booking.customerName}</span>
                                                {(hasNotes || hasEmail) && (
                                                    <button
                                                        onClick={() => toggleExpand(booking.id)}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem',
                                                            fontSize: '0.7rem',
                                                            color: 'var(--terracotta-base)',
                                                            background: 'none',
                                                            border: 'none',
                                                            padding: '0.125rem 0',
                                                            cursor: 'pointer',
                                                            textDecoration: 'underline',
                                                        }}
                                                    >
                                                        {isExpanded ? '▲ Hide details' : '▼ View details'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className={styles.tableCell}>
                                            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--charcoal-warm)' }}>{booking.customerPhone}</span>
                                            </div>
                                        </td>
                                        <td className={styles.tableCell}>
                                            <span title={booking.services.map(s => s.name).join(', ')}>
                                                {getServiceNames(booking.services)}
                                            </span>
                                        </td>
                                        <td className={styles.tableCell}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span>{formatDate(booking.bookingDate)}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--bronze-light)' }}>{booking.bookingTime}</span>
                                            </div>
                                        </td>
                                        <td className={styles.tableCell} style={{ fontWeight: 500, color: 'var(--charcoal-warm)' }}>₱{booking.totalPrice.toLocaleString()}</td>
                                        <td className={styles.tableCell}>
                                            <span
                                                style={{
                                                    ...getStatusStyle(booking.status),
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    padding: '0.125rem 0.625rem',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                    textTransform: 'capitalize'
                                                }}
                                            >
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className={styles.tableCell}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {booking.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => onStatusChange?.(booking.id, 'confirmed')}
                                                            style={{
                                                                padding: '0.25rem 0.5rem',
                                                                background: 'rgba(34, 197, 94, 0.1)',
                                                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                                                borderRadius: '6px',
                                                                color: '#16a34a',
                                                                fontSize: '0.75rem',
                                                                cursor: 'pointer',
                                                            }}
                                                            title="Confirm booking"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => onStatusChange?.(booking.id, 'cancelled')}
                                                            style={{
                                                                padding: '0.25rem 0.5rem',
                                                                background: 'rgba(239, 68, 68, 0.1)',
                                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                                borderRadius: '6px',
                                                                color: '#ef4444',
                                                                fontSize: '0.75rem',
                                                                cursor: 'pointer',
                                                            }}
                                                            title="Cancel booking"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {booking.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => onStatusChange?.(booking.id, 'completed')}
                                                        style={{
                                                            padding: '0.25rem 0.5rem',
                                                            background: 'rgba(59, 130, 246, 0.1)',
                                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                                            borderRadius: '6px',
                                                            color: '#3b82f6',
                                                            fontSize: '0.75rem',
                                                            cursor: 'pointer',
                                                        }}
                                                        title="Mark as completed"
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onDelete?.(booking.id)}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        borderRadius: '6px',
                                                        color: '#ef4444',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                    }}
                                                    title="Delete booking"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                    </svg>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Expanded details row */}
                                    {isExpanded && (
                                        <tr key={`${booking.id}-expanded`}>
                                            <td colSpan={7} style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(232, 180, 184, 0.1)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                                    {hasEmail && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--bronze-light)', textTransform: 'uppercase' }}>Email</span>
                                                            <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-warm)' }}>
                                                                <a href={`mailto:${booking.customerEmail}`} style={{ color: 'var(--terracotta-base)', textDecoration: 'none' }}>
                                                                    {booking.customerEmail}
                                                                </a>
                                                            </span>
                                                        </div>
                                                    )}
                                                    {hasNotes && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '200px' }}>
                                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--bronze-light)', textTransform: 'uppercase' }}>📝 Customer Notes</span>
                                                            <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-warm)', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                                                                "{booking.notes}"
                                                            </span>
                                                        </div>
                                                    )}
                                                    {booking.services.length > 1 && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--bronze-light)', textTransform: 'uppercase' }}>All Services</span>
                                                            <ul style={{ fontSize: '0.85rem', color: 'var(--charcoal-warm)', margin: 0, paddingLeft: '1rem' }}>
                                                                {booking.services.map((s, i) => (
                                                                    <li key={i}>{s.name} - ₱{s.price.toLocaleString()}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
