'use client';

import MasterTable from '@/components/MasterTable';
import { MASTER_CONFIG } from '@/lib/masterConfig';

export default function UserMaster() {
    return <MasterTable config={MASTER_CONFIG['user']} title="User" />;
}
