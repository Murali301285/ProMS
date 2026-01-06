
import WaterTankerForm from '@/components/WaterTankerForm';

export const dynamic = 'force-dynamic';

async function getHelpers() {
    try {
        // Fetch from our local API
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/transaction/water-tanker-entry/helpers`, { cache: 'no-store' });

        if (!res.ok) {
            console.error("Failed to fetch helpers");
            return {};
        }
        return await res.json();
    } catch (e) {
        console.error("Helper fetch failed:", e);
        return {};
    }
}

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function getUsersRole() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (token) {
        try {
            const decoded = jwt.decode(token);
            return decoded?.role || 'User';
        } catch (e) {
            return 'User';
        }
    }
    return 'User';
}

export default async function AddWaterTankerEntry() {
    const helpers = await getHelpers();
    const role = await getUsersRole();

    return (
        <WaterTankerForm initialHelpers={helpers} userRole={role} />
    );
}
