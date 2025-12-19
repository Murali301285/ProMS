'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Redirect /dashboard/reports -> /dashboard/reports/dashboard
 */
export default function ReportsRoot() {
    const router = useRouter();

    useEffect(() => {
        router.push('/dashboard/reports/dashboard');
    }, [router]);

    return (
        <div className="p-8 flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4 text-slate-400">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p>Loading Dashboard...</p>
            </div>
        </div>
    );
}
