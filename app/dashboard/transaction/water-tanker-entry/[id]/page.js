
import WaterTankerForm from '@/components/WaterTankerForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getHelpers(baseUrl) {
    try {
        const res = await fetch(`${baseUrl}/api/transaction/water-tanker-entry/helpers`, { cache: 'no-store' });
        if (!res.ok) return {};
        return await res.json();
    } catch (e) {
        return {};
    }
}

async function getData(id, baseUrl) {
    try {
        const res = await fetch(`${baseUrl}/api/transaction/water-tanker-entry/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        return null;
    }
}

export default async function EditWaterTankerEntry({ params }) {
    const { id } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Parallel fetch
    const [helpers, data] = await Promise.all([
        getHelpers(baseUrl),
        getData(id, baseUrl)
    ]);

    if (!data) return notFound();

    return (
        <WaterTankerForm initialHelpers={helpers} initialData={data} />
    );
}
