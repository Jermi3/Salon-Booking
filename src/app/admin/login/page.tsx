'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message || 'Failed to sign in');
            setIsSubmitting(false);
        } else {
            router.push('/admin');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'linear-gradient(135deg, #fef6f0 0%, #fdf2e9 25%, #fce8db 50%, #f9d9c6 75%, #f5c9b0 100%)',
        }}>
            {/* Login Card */}
            <div style={{
                maxWidth: '400px',
                width: '100%',
                padding: '2.5rem',
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: '#3d3d3d',
                        marginBottom: '0.5rem',
                        letterSpacing: '0.05em',
                    }}>
                        PA RESERVE
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: '#8b7355' }}>Admin Dashboard</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {error && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '10px',
                            color: '#ef4444',
                            fontSize: '0.85rem',
                        }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#3d3d3d', marginBottom: '0.5rem' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@pareserve.ph"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: '1px solid rgba(0,0,0,0.1)',
                                borderRadius: '10px',
                                fontSize: '0.95rem',
                                background: 'rgba(255,255,255,0.8)',
                                outline: 'none',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#3d3d3d', marginBottom: '0.5rem' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: '1px solid rgba(0,0,0,0.1)',
                                borderRadius: '10px',
                                fontSize: '0.95rem',
                                background: 'rgba(255,255,255,0.8)',
                                outline: 'none',
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            padding: '0.875rem 1.5rem',
                            background: 'linear-gradient(135deg, #c45c35, #a84b2a)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            opacity: isSubmitting ? 0.7 : 1,
                            boxShadow: '0 4px 12px rgba(196, 92, 53, 0.3)',
                            marginTop: '0.5rem',
                        }}
                    >
                        {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#8b7355' }}>
                    Protected admin area • Pa Reserve PH
                </p>
            </div>
        </div>
    );
}
