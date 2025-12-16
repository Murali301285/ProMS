'use client';

import { useState, useEffect, use } from 'react';
import MaterialRehandlingForm from '@/components/MaterialRehandlingForm';
import { useRouter } from 'next/navigation';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function MaterialRehandlingEditPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecord() {
            try {
                // Fetch from new GET API
                const res = await fetch(`/api/transaction/material-rehandling/${id}`);
                const result = await res.json();

                if (result.success && result.data) {
                    setData(result.data);
                } else {
                    console.error("Record not found or API error");
                    router.push('/dashboard/transaction/material-rehandling');
                }
            } catch (e) {
                console.error("Fetch Error:", e);
                router.push('/dashboard/transaction/material-rehandling');
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchRecord();
    }, [id, router]);

    if (loading) return <LoadingOverlay message="Loading Record..." />;
    if (!data) return null;

    return (
        <MaterialRehandlingForm
            initialData={data}
            isEdit={true}
        />
    );
}
