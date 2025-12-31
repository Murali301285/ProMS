import DashboardLayout from '@/components/DashboardLayout';
import SessionManager from '@/components/SessionManager';

export default function Layout({ children }) {
    return (
        <>
            <SessionManager />
            <DashboardLayout>{children}</DashboardLayout>
        </>
    );
}
