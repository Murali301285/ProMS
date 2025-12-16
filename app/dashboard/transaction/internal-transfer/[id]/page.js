'use client';

import { use, useState, useEffect } from 'react';
import InternalTransferForm from '@/components/InternalTransferForm';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditPage({ params }) {
    // Unwrapping params using React.use()
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch specific record
                const res = await fetch(`/api/transaction/internal-transfer/${id}`).then(r => r.json());
                if (res.success && res.data) {
                    setData(res.data);
                } else {
                    toast.error("Failed to load record");
                }
            } catch (e) {
                console.error(e);
                toast.error("Error loading data");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline mr-2" /> Loading Record...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Record not found</div>;

    return <InternalTransferForm initialData={data} isEdit={true} />;
}
