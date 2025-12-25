import type { Metadata } from 'next';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export const metadata: Metadata = {
    title: 'Admin Dashboard | Pa Reserve PH',
    description: 'Manage bookings and services',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminLayoutClient>
            {children}
        </AdminLayoutClient>
    );
}
