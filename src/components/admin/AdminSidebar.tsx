'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '@/app/admin/admin.module.css';

interface AdminSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
    const pathname = usePathname();

    const navItems = [
        {
            label: 'Dashboard',
            href: '/admin',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="7" height="9" x="3" y="3" rx="1" />
                    <rect width="7" height="5" x="14" y="3" rx="1" />
                    <rect width="7" height="9" x="14" y="12" rx="1" />
                    <rect width="7" height="5" x="3" y="16" rx="1" />
                </svg>
            )
        },
        {
            label: 'Bookings',
            href: '/admin/bookings',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
                </svg>
            )
        },
        {
            label: 'Services',
            href: '/admin/services',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                </svg>
            )
        },
        {
            label: 'Categories',
            href: '/admin/categories',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                    <path d="M7 7h.01" />
                </svg>
            )
        },
        {
            label: 'Schedule',
            href: '/admin/schedule',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            )
        },
    ];

    // Inline styles for fixed positioning/transform that CSS modules can't handle as easily dynamically (or just to keep it simple for the drawer logic)
    const mobileDrawerStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '280px', // Match CSS module width
        zIndex: 50,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-in-out',
    };

    const backdropStyle: React.CSSProperties = {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)', // Slightly lighter backdrop
        backdropFilter: 'blur(4px)',
        zIndex: 40,
        display: isOpen ? 'block' : 'none',
    };

    return (
        <>
            {/* Mobile Backdrop */}
            <div style={backdropStyle} onClick={onClose} />

            {/* Sidebar Drawer */}
            <aside className={styles.sidebar} style={mobileDrawerStyle}>
                <div style={{ padding: '0 0 2rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1 className={styles.sidebarLogo}>PA RESERVE <span style={{ display: 'inline-block', padding: '0.15rem 0.35rem', fontSize: '0.5em', fontWeight: 700, color: 'var(--terracotta-base)', border: '1.5px solid var(--terracotta-base)', borderRadius: '4px', marginLeft: '0.3rem', position: 'relative', top: '-0.15em' }}>PH</span></h1>
                    <button
                        onClick={onClose}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.5rem', color: '#a3a3a3' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                        </svg>
                    </button>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const activeClass = isActive ? styles.navItemActive : '';

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`${styles.navItem} ${activeClass}`}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? 'var(--terracotta-base)' : 'inherit' }}>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.4)', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '9999px', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' }}>A</div>
                        <div>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--charcoal-warm)', margin: 0 }}>Admin User</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--bronze-light)', margin: 0 }}>admin@pareserve.ph</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
