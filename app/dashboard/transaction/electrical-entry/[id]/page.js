import ElectricalEntryForm from '@/components/ElectricalEntryForm';
import { getDbConnection, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getData(id) {
    try {
        const pool = await getDbConnection();
        const result = await pool.request()
            .input('id', sql.BigInt, id)
            .query(`SELECT * FROM [Trans].[TblElectricalEntry] WHERE SlNo = @id AND IsDelete = 0`);

        if (result.recordset.length > 0) {
            return JSON.parse(JSON.stringify(result.recordset[0]));
        }
    } catch (err) {
        console.error("Fetch Error:", err);
    }
    return null;
}

export default async function UpdateElectricalEntryPage({ params }) {
    const { id } = await params;
    const data = await getData(id);

    if (!data) {
        return <div className="p-8 text-red-500">Record not found or deleted.</div>;
    }

    return <ElectricalEntryForm mode="edit" initialData={data} />;
}
