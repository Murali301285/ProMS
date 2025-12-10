'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { MASTER_CONFIG } from '@/lib/masterConfig';
import MasterTable from '@/components/MasterTable';

export default function MasterPage({ params }) {
    const { type } = use(params);

    const config = MASTER_CONFIG[type];

    if (!config) {
        return notFound();
    }

    // Convert slug to Title Case
    const title = type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return <MasterTable config={config} title={title} />;
}
