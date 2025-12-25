'use client';

import styles from '@/app/admin/admin.module.css';

interface StatCardProps {
    title: string;
    value: string;
    trend: string;
    trendUp: boolean;
    onClick?: () => void;
}

export default function StatCard({ title, value, trend, trendUp, onClick }: StatCardProps) {
    return (
        <div
            className={styles.statCard}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }}
        >
            <div>
                <h3 className={styles.statValue}>{value}</h3>
                <p className={styles.statLabel}>{title}</p>
            </div>

            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                    className={`${styles.statTrend} ${trendUp ? styles.trendUp : styles.trendDown}`}
                >
                    {trendUp ? '↑' : '↓'} {trend}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--bronze-light)' }}>vs last month</span>
            </div>
        </div>
    );
}
