'use client';

import { useRouter } from 'next/navigation';
import { MASTER_CONFIG } from '@/lib/masterConfig';
import BulkUploadWizard from '@/components/BulkUploadWizard';

export default function OperatorBulkUploadPage() {
    const router = useRouter();
    const config = MASTER_CONFIG['operator'];

    const handleBack = () => {
        router.push('/dashboard/master/operator');
    };

    if (!config) {
        return <div className="p-8 text-center text-red-500">Configuration not found for Operator.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <BulkUploadWizard
                config={config}
                tableTitle="Operator"
                onBack={handleBack}
            />
        </div>
    );
}
