'use client';

import { useRouter } from 'next/navigation';
import { MASTER_CONFIG } from '@/lib/masterConfig';
import BulkUploadWizard from '@/components/BulkUploadWizard';

export default function EquipmentGroupBulkUploadPage() {
    const router = useRouter();
    const config = MASTER_CONFIG['equipment-group'];

    const handleBack = () => {
        router.push('/dashboard/master/equipment-group');
    };

    if (!config) {
        return <div className="p-8 text-center text-red-500">Configuration not found for Equipment Group.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <BulkUploadWizard
                config={config}
                tableTitle="Equipment Group"
                onBack={handleBack}
            />
        </div>
    );
}
