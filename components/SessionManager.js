'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SessionManager() {
    const router = useRouter();
    const [showWarning, setShowWarning] = useState(false);

    // Config: 
    // WARN_TIME: 15 Mins = 15 * 60 * 1000
    // LOGOUT_TIME: 30 Mins = 30 * 60 * 1000
    const WARN_TIME = 15 * 60 * 1000;
    const LOGOUT_TIME = 30 * 60 * 1000;

    // For Testing (Comment out above and use these if needed)
    // const WARN_TIME = 10 * 1000; // 10s
    // const LOGOUT_TIME = 20 * 1000; // 20s

    const lastActivity = useRef(Date.now());
    const warningTimer = useRef(null);
    const logoutTimer = useRef(null);

    const logout = useCallback(async () => {
        try {
            console.log("🔒 [SessionManager] Inactivity Timeout. Logging out...");
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/');
            toast.error("Session timed out due to inactivity.");
        } catch (e) {
            console.error("Logout failed", e);
            router.push('/');
        }
    }, [router]);

    const startTimers = useCallback(() => {
        // Clear existing
        if (warningTimer.current) clearTimeout(warningTimer.current);
        if (logoutTimer.current) clearTimeout(logoutTimer.current);

        // Set Warning
        warningTimer.current = setTimeout(() => {
            console.log("⚠️ [SessionManager] Warning Triggered");
            setShowWarning(true);
        }, WARN_TIME);

        // Set Logout
        logoutTimer.current = setTimeout(() => {
            logout();
        }, LOGOUT_TIME);

    }, [LOGOUT_TIME, WARN_TIME, logout]);

    const resetActivity = useCallback(() => {
        lastActivity.current = Date.now();
        if (showWarning) setShowWarning(false); // Auto-dismiss warning on activity? Or force click? 
        // User Requirement: "Need Pop-up warning in 15 Mins and force logged out after 30 Mins."
        // Usually, if user moves mouse, they are active. So warning should go away and timers reset.

        startTimers();
    }, [showWarning, startTimers]);

    // Throttled Event Listener
    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

        let throttleTimer;
        const handleEvent = () => {
            if (!throttleTimer) {
                throttleTimer = setTimeout(() => {
                    resetActivity();
                    throttleTimer = null;
                }, 1000); // Check at most once per second
            }
        };

        // Attach listeners
        events.forEach(event => window.addEventListener(event, handleEvent));

        // Initial Start
        startTimers();

        return () => {
            events.forEach(event => window.removeEventListener(event, handleEvent));
            if (warningTimer.current) clearTimeout(warningTimer.current);
            if (logoutTimer.current) clearTimeout(logoutTimer.current);
            if (throttleTimer) clearTimeout(throttleTimer);
        };
    }, [resetActivity, startTimers]);

    if (!showWarning) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl p-6 w-[400px] border border-red-100">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Expiring Soon</h3>
                    <p className="text-gray-500 mb-6">
                        You have been inactive for 15 minutes. You will be automatically logged out in 15 minutes to protect your account.
                    </p>

                    <button
                        onClick={() => {
                            resetActivity();
                            toast.success("Session Extended");
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                        I'm still here
                    </button>
                </div>
            </div>
        </div>
    );
}
