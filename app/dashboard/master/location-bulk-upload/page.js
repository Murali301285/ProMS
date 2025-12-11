'use client';

import { useRouter } from 'next/navigation';
import { MASTER_CONFIG } from '@/lib/masterConfig';
import BulkUploadWizard from '@/components/BulkUploadWizard';

export default function LocationBulkUploadPage() {
    const router = useRouter();
    const config = MASTER_CONFIG['location'];

    const handleBack = () => {
        router.push('/dashboard/master/location');
    };

    if (!config) {
        return <div className="p-8 text-center text-red-500">Configuration not found for Location.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <BulkUploadWizard
                config={config}
                tableTitle="Location"
                onBack={handleBack}
            />
        </div>
    );
}
