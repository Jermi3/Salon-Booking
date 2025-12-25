'use client';

import { Service, ServiceCategory } from '@/config/services.config';
import styles from '@/app/admin/admin.module.css';

interface ServiceGridProps {
    categories: ServiceCategory[];
    onEdit?: (service: Service & { categoryId: string }) => void;
    onDelete?: (serviceId: string, serviceName: string) => void;
}

export default function ServiceGrid({ categories, onEdit, onDelete }: ServiceGridProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {categories.map((category) => (
                <div key={category.id}>
                    {/* Category Title */}
                    <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{
                            fontSize: '2rem',
                            fontFamily: 'var(--font-serif)',
                            fontWeight: 700,
                            color: 'var(--charcoal-warm)',
                            margin: 0,
                            letterSpacing: '-0.02em'
                        }}>
                            {category.name}
                        </h2>
                        <span style={{ fontSize: '0.875rem', color: 'var(--bronze-light)' }}>
                            {category.services.length} service{category.services.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {category.services.length === 0 ? (
                        <div style={{
                            padding: '3rem',
                            textAlign: 'center',
                            background: 'rgba(255,255,255,0.3)',
                            borderRadius: '1rem',
                            border: '2px dashed rgba(212, 175, 55, 0.2)',
                        }}>
                            <p style={{ color: 'var(--bronze-light)', margin: 0 }}>No services in this category yet</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                            {category.services.map((service) => (
                                <div key={service.id} className={styles.glassCard} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                                    {/* Action buttons */}
                                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => onEdit?.({ ...service, categoryId: category.id })}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                background: 'rgba(255,255,255,0.8)',
                                                border: '1px solid rgba(0,0,0,0.1)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s ease',
                                            }}
                                            title="Edit service"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--charcoal-warm)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                <path d="m15 5 4 4" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onDelete?.(service.id, service.name)}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s ease',
                                            }}
                                            title="Delete service"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', paddingRight: '5rem' }}>
                                        <h3 style={{
                                            fontSize: '1.5rem',
                                            fontWeight: 700,
                                            color: 'var(--charcoal-warm)',
                                            fontFamily: 'var(--font-serif)',
                                            margin: 0,
                                            lineHeight: 1.2
                                        }}>
                                            {service.name}
                                        </h3>
                                    </div>

                                    {service.popular && (
                                        <span style={{
                                            display: 'inline-block',
                                            width: 'fit-content',
                                            padding: '0.25rem 0.75rem',
                                            background: 'linear-gradient(135deg, var(--gold-base), var(--gold-light))',
                                            color: 'var(--charcoal-warm)',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            borderRadius: '9999px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            boxShadow: '0 2px 8px rgba(212, 175, 55, 0.25)',
                                            marginBottom: '1rem',
                                        }}>
                                            Popular
                                        </span>
                                    )}

                                    <p style={{ fontSize: '0.95rem', color: 'var(--bronze-light)', marginBottom: '2rem', flex: 1, lineHeight: 1.6 }}>{service.description}</p>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.5rem', borderTop: '1px solid rgba(212, 175, 55, 0.15)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--bronze-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Price</span>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--terracotta-base)', fontFamily: 'var(--font-serif)' }}>₱{service.price.toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--bronze-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Duration</span>
                                            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--charcoal-warm)' }}>{service.duration}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
