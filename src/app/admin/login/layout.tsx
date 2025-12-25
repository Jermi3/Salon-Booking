import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin Login | Pa Reserve PH',
    description: 'Sign in to admin dashboard',
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Login page has its own simple layout - no sidebar
    return <>{children}</>;
}
