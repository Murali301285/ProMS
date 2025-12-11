'use client';

import { useRouter } from 'next/navigation';
import { MASTER_CONFIG } from '@/lib/masterConfig';
import BulkUploadWizard from '@/components/BulkUploadWizard';

export default function EquipmentBulkUploadPage() {
    const router = useRouter();
    const config = MASTER_CONFIG['equipment'];

    const handleBack = () => {
        router.push('/dashboard/master/equipment');
    };

    if (!config) {
        return <div className="p-8 text-center text-red-500">Configuration not found for Equipment.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <BulkUploadWizard
                config={config}
                tableTitle="Equipment"
                onBack={handleBack}
            />
        </div>
    );
}
