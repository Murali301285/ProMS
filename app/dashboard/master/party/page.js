'use client';

import MasterTable from '@/components/MasterTable';
import { MASTER_CONFIG } from '@/lib/masterConfig';

export default function PartyMaster() {
    return <MasterTable config={MASTER_CONFIG['party']} title="Party Master" />;
}
