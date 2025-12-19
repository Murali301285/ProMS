'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DrillingForm from '@/components/DrillingForm';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function EditDrillingPage() {
    const params = useParams();
    const { id } = params;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecord() {
            try {
                const res = await fetch(`/api/transaction/drilling/${id}`);
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                } else {
                    alert(result.error || 'Record not found');
                }
            } catch (error) {
                console.error(error);
                alert('Failed to load record');
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchRecord();
    }, [id]);

    if (loading) return <LoadingOverlay message="Loading Record..." />;
    if (!data) return <div>Record Not Found</div>;

    return <DrillingForm mode="edit" initialData={data} />;
}
