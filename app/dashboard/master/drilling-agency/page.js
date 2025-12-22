'use client';

import MasterTable from '@/components/MasterTable';
import { MASTER_CONFIG } from '@/lib/masterConfig';

export default function DrillingAgencyMaster() {
    return <MasterTable config={MASTER_CONFIG['drilling-agency']} title="Drilling Agency" />;
}
