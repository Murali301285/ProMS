'use client';

import { useEffect, useState, use } from 'react';
import BlastingForm from '@/components/BlastingForm';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function EditBlastingPage({ params }) {
    const { id } = use(params);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/transaction/blasting/${id}`)
            .then(res => res.json())
            .then(result => {
                if (result.data) setData(result.data);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <LoadingOverlay message="Loading..." />;
    if (!data) return <div>Record not found</div>;

    return <BlastingForm mode="update" initialData={data} />;
}
