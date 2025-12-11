import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Fetch Active Destinations
        const destinations = await executeQuery(`
            SELECT SlNo as id, Name as name 
            FROM [Master].[TblDestination] 
            WHERE IsDelete = 0 AND IsActive = 1
            ORDER BY Name ASC
        `);

        // Fetch Active Materials
        const materials = await executeQuery(`
            SELECT SlNo as id, MaterialName as name 
            FROM [Master].[TblMaterial] 
            WHERE IsDelete = 0 
            ORDER BY MaterialName ASC
        `);

        // Fetch Existing Mappings
        const mappings = await executeQuery(`
            SELECT SlNo as id, DestinationId, MaterialId 
            FROM [Master].[TblDestinationMaterialMapping] 
            WHERE IsActive = 1
        `);

        return NextResponse.json({ destinations, materials, mappings });
    } catch (error) {
        console.error('Mapping Fetch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { destinationId, materialId } = await req.json();

        if (!destinationId || !materialId) {
            return NextResponse.json({ error: 'Missing destination or material ID' }, { status: 400 });
        }

        // Check availability (optional, but good practice to avoid duplicates if Unique constraint missing)
        // Assuming no unique constraint in schema, but we should prevent dupes.
        const existing = await executeQuery(`
            SELECT SlNo FROM [Master].[TblDestinationMaterialMapping]
            WHERE DestinationId = @d AND MaterialId = @m AND IsActive = 1
        `, [
            { name: 'd', type: 'Int', value: destinationId },
            { name: 'm', type: 'Int', value: materialId }
        ]);

        if (existing.length > 0) {
            return NextResponse.json({ success: true, id: existing[0].SlNo, message: 'Already exists' });
        }

        await executeQuery(`
            INSERT INTO [Master].[TblDestinationMaterialMapping] (DestinationId, MaterialId, IsActive)
            VALUES (@d, @m, 1)
        `, [
            { name: 'd', type: 'Int', value: destinationId },
            { name: 'm', type: 'Int', value: materialId }
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Mapping Create Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        // Physical Delete (or Set IsActive=0 if preferred, sticking to IsActive=0 for safety as no IsDelete col)
        // User script has IsActive default 1. Let's use IsActive=0 to 'remove'.
        // Actually, user said 'remove', usually mapping tables are physical delete.
        // But let's set IsActive = 0 to be safe.

        // Wait, if I set IsActive=0, the POST check above needs to check IsActive=1? Yes it does.
        // If I physically delete, it's gone.
        // I will use Physical Delete to keep table clean, unless user asks for history.
        // "Remove" usually implies delete.

        await executeQuery(`
            DELETE FROM [Master].[TblDestinationMaterialMapping] WHERE SlNo = @id
        `, [
            { name: 'id', type: 'Int', value: id }
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Mapping Delete Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
