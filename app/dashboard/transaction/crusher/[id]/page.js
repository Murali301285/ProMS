
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CrusherForm from '@/components/CrusherForm';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function EditCrusherPage() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/transaction/crusher/${id}`)
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data) setData(res.data);
                else setError(res.message || 'Record not found');
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <LoadingOverlay message="Loading Record..." />;
    if (error) return <div className="p-4 text-red-500 font-bold">Error: {error}</div>;
    if (!data) return <div>Record not found</div>;

    return <CrusherForm initialData={data} mode="update" />;
}
