'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }) {
    // Default to 'true' means Mini (Collapsed) state on Desktop
    // If you want it fully open by default, set to 'false'
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const router = useRouter();

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    // Global Key Listener for Ctrl+L
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
                e.preventDefault();
                setShowLogoutModal(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/');
        } catch (error) {
            console.error("Logout failed", error);
            // Fallback redirect
            router.push('/');
        }
    };

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
                <main style={{ flex: 1, padding: '.5rem', overflowY: 'auto' }}>
                    {children}
                </main>
                <footer style={{
                    textAlign: 'center',
                    padding: '0 1rem 1rem 1rem',
                    fontSize: '0.8rem',
                    color: 'var(--secondary-foreground)',
                    opacity: 0.7
                }}>
                    ProMS © 2026
                </footer>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100vh',
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                    backdropFilter: 'blur(5px)'
                }}>
                    <div style={{
                        background: 'var(--card)',
                        color: 'var(--foreground)',
                        padding: '2rem',
                        borderRadius: 'var(--radius)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                        width: '90%',
                        maxWidth: '400px',
                        textAlign: 'center',
                        border: '1px solid var(--border)'
                    }}>
                        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Confirm Logout</h2>
                        <p style={{ marginBottom: '2rem', opacity: 0.8 }}>Are you sure you want to log out of the application?</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: 'var(--radius)',
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    color: 'var(--foreground)',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: 'var(--radius)',
                                    border: 'none',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
