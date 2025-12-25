'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import { ServicesProvider } from '@/context/ServicesContext';
import { BookingsProvider } from '@/context/BookingsContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import styles from '@/app/admin/admin.module.css';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut, isLoading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Redirect to login if not authenticated (skip for login page)
    useEffect(() => {
        if (!isLoading && !user && pathname !== '/admin/login') {
            router.push('/admin/login');
        }
    }, [user, isLoading, pathname, router]);

    const handleLogout = async () => {
        await signOut();
        router.push('/admin/login');
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className={styles.meshBackground}>
                    <div className={styles.meshOrb1} />
                    <div className={styles.meshOrb2} />
                    <div className={styles.meshOrb3} />
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
            </div>
        );
    }

    // For login page, just render children without the dashboard layout
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    // If not authenticated, show loading (redirect will happen)
    if (!user) {
        return (
            <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className={styles.meshBackground}>
                    <div className={styles.meshOrb1} />
                    <div className={styles.meshOrb2} />
                    <div className={styles.meshOrb3} />
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>Redirecting to login...</p>
            </div>
        );
    }

    return (
        <ServicesProvider>
            <BookingsProvider>
                <div className={styles.page}>
                    {/* Rich Mesh Gradient Background */}
                    <div className={styles.meshBackground}>
                        <div className={styles.meshOrb1} />
                        <div className={styles.meshOrb2} />
                        <div className={styles.meshOrb3} />
                    </div>

                    <div className={styles.dashboardContainer}>
                        {/* Mobile Header */}
                        <header className={styles.mobileHeader}>
                            <h1 className={styles.sidebarLogo}>PA RESERVE <span style={{ display: 'inline-block', padding: '0.15rem 0.35rem', fontSize: '0.5em', fontWeight: 700, color: 'var(--terracotta-base)', border: '1.5px solid var(--terracotta-base)', borderRadius: '4px', marginLeft: '0.3rem', position: 'relative', top: '-0.15em' }}>PH</span></h1>
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                style={{ background: 'transparent', border: 'none', padding: '0.5rem', cursor: 'pointer' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#525252' }}>
                                    <line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="18" y2="18" />
                                </svg>
                            </button>
                        </header>

                        {/* Desktop Sidebar */}
                        {!isMobile && (
                            <aside className={styles.sidebar}>
                                <div style={{ paddingBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                                    <h1 className={styles.sidebarLogo}>PA RESERVE <span style={{ display: 'inline-block', padding: '0.15rem 0.35rem', fontSize: '0.5em', fontWeight: 700, color: 'var(--terracotta-base)', border: '1.5px solid var(--terracotta-base)', borderRadius: '4px', marginLeft: '0.3rem', position: 'relative', top: '-0.15em' }}>PH</span></h1>
                                </div>
                                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <DesktopNavLink href="/admin" label="Dashboard" icon={<DashboardIcon />} />
                                    <DesktopNavLink href="/admin/bookings" label="Bookings" icon={<BookingsIcon />} />
                                    <DesktopNavLink href="/admin/services" label="Services" icon={<ServicesIcon />} />
                                    <DesktopNavLink href="/admin/categories" label="Categories" icon={<CategoriesIcon />} />
                                    <DesktopNavLink href="/admin/schedule" label="Schedule" icon={<ScheduleIcon />} />
                                </nav>
                                <div style={{ paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.4)', marginTop: 'auto' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '9999px', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' }}>
                                            {user.email?.charAt(0).toUpperCase() || 'A'}
                                        </div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--charcoal-warm)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Admin</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--bronze-light)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem 1rem',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            borderRadius: '8px',
                                            color: '#ef4444',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            </aside>
                        )}

                        {/* Mobile Sidebar (Drawer) */}
                        {isMobile && <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}

                        {/* Main Content */}
                        <main className={styles.mainContent}>
                            {children}
                        </main>
                    </div>
                </div>
            </BookingsProvider>
        </ServicesProvider>
    );
}

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </AuthProvider>
    );
}

// Helper Components
function DesktopNavLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
    const pathname = usePathname();
    const isActive = pathname === href;
    const activeClass = isActive ? styles.navItemActive : '';

    return (
        <a href={href} className={`${styles.navItem} ${activeClass}`}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? 'var(--terracotta-base)' : 'inherit' }}>{icon}</span>
            <span>{label}</span>
        </a>
    );
}

function DashboardIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
    );
}

function BookingsIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
        </svg>
    );
}

function ServicesIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
        </svg>
    );
}

function CategoriesIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
            <path d="M7 7h.01" />
        </svg>
    );
}

function ScheduleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

