'use client';

import MasterTable from '@/components/MasterTable';
import { MASTER_CONFIG } from '@/lib/masterConfig';

export default function RoleMaster() {
    return <MasterTable config={MASTER_CONFIG['role']} title="Role" />;
}
