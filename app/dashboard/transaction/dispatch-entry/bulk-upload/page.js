'use client';

import { useRouter } from 'next/navigation';
import BDSBulkUploadWizard from '@/components/BDSBulkUploadWizard';

export default function DispatchEntryBulkUploadPage() {
    const router = useRouter();

    const handleBack = () => {
        router.push('/dashboard/transaction/dispatch-entry');
    };

    return (
        <div className="min-h-screen bg-slate-50/50">
            <BDSBulkUploadWizard onBack={handleBack} />
        </div>
    );
}
