'use client';

import { useRouter } from 'next/navigation';
import { MASTER_CONFIG } from '@/lib/masterConfig';
import BulkUploadWizard from '@/components/BulkUploadWizard';

export default function DrillingRemarksBulkUploadPage() {
    const router = useRouter();
    const config = MASTER_CONFIG['drilling-remarks'];

    // Back Handler: Navigate to Parenting Table
    const handleBack = () => {
        router.push('/dashboard/master/drilling-remarks');
    };

    if (!config) {
        return <div className="p-8 text-center text-red-500">Configuration not found for Drilling Remarks.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <BulkUploadWizard
                config={config}
                tableTitle="Drilling Remarks"
                onBack={handleBack}
            />
        </div>
    );
}
