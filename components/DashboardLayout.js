'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }) {
    // Default to 'true' means Mini (Collapsed) state on Desktop
    // If you want it fully open by default, set to 'false'
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            <div style={{
                flex: 1,
                // Adjust margin based on collapsed state logic
                marginLeft: isSidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
                transition: 'margin-left 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
            }}>
                <Header toggleSidebar={toggleSidebar} isSidebarOpen={!isSidebarCollapsed} />
                <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
                    {children}
                </main>
                <footer style={{
                    textAlign: 'center',
                    padding: '1rem',
                    fontSize: '0.8rem',
                    color: 'var(--secondary-foreground)',
                    opacity: 0.7
                }}>
                    ProMS © 2026
                </footer>
            </div>
        </div>
    );
}
