'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import EquipmentReadingForm from '@/components/EquipmentReadingForm';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function EditEquipmentReadingPage() {
    const params = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!params.id) return;

        async function load() {
            try {
                const res = await fetch(`/api/transaction/equipment-reading/${params.id}`);
                const json = await res.json();

                if (json.success) {
                    setData(json.data);
                } else {
                    console.error("Load Error:", json);
                    setError(json.message + (json.stack ? "\n" + json.stack : ""));
                }
            } catch (e) {
                console.error(e);
                setError(e.message);
            }
            finally { setLoading(false); }
        }
        load();
    }, [params.id]);

    if (loading) return <LoadingOverlay message="Loading Record..." />;
    if (error) return (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded">
            <h3 className="font-bold">Error Loading Record</h3>
            <pre className="whitespace-pre-wrap text-xs mt-2">{error}</pre>
        </div>
    );
    if (!data) return <div>Record not found</div>;

    return <EquipmentReadingForm isEdit={true} initialData={data} />;
}
