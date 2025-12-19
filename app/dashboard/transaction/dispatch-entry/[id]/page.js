'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DispatchEntryForm from '@/components/DispatchEntryForm';
import { Loader2 } from 'lucide-react';

export default function EditDispatchEntry() {
    const params = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/transaction/dispatch-entry/${params.id}`);
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [params.id]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    if (!data) return <div className="text-red-500 p-8">Record not found</div>;

    return <DispatchEntryForm mode="edit" initialData={data} />;
}
