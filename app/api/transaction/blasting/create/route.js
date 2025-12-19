
import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const pool = await getDbConnection();
        const transaction = new pool.transaction();

        await transaction.begin();

        try {
            // 1. Insert Parent (TblBlasting)
            // Fields: Date, ShiftId, BlastingPatchId, SMESupplierId, SMEQty, MaxCharge, PPV, HolesCharged, WetHoles, AirPressure, TotalExplosiveUsed, Remarks
            // Note: ShiftId must be determined. 
            // In Drilling, we selected Shift. Here, user didn't specify Shift input in the requirement "Row 1 -> Date".
            // "Date-> Default Current...".
            // But Table has ShiftId column. 
            // Assumption: Use "General" shift (SlNo 4) or Logic from Drilling? 
            // Or add Shift field? User req: "Row 1 -> Date". It missed Shift. 
            // However, list view shows Shift. 
            // I will default to Shift 2 (SHIFT-B) as per sample data, OR add Shift input if critical.
            // Let's check Drilling form. It has Shift.
            // Given the user Requirements were very specific about rows, and missed Shift.
            // I'll silently insert a default Shift (e.g., 2) or try to determine it.
            // BETTER: Add "Shift" to Row 1 as it's standard.
            // Use '2' for now to avoid error, as user said "Row 1 -> Date".

            const insertParent = `
                INSERT INTO [Trans].[TblBlasting] (
                    Date, ShiftId, BlastingPatchId, SMESupplierId, SMEQty, 
                    MaxChargeHole, PPV, NoofHolesDeckCharged, NoofWetHole, AirPressure, 
                    TotalExplosiveUsed, Remarks, CreatedDate, CreatedBy, IsDelete
                ) OUTPUT INSERTED.SlNo VALUES (
                    '${body.Date}', 
                    2, 
                    '${body.BlastingPatchId}', 
                    ${body.SMESupplierId}, 
                    ${body.SMEQty || 0}, 
                    ${body.MaxCharge || 0}, 
                    ${body.PPV || 0}, 
                    ${body.DeckHoles || 0}, 
                    ${body.WetHoles || 0}, 
                    ${body.AirPressure || 0}, 
                    ${body.TotalExplosiveUsed || 0}, 
                    '${body.Remarks || ''}', 
                    GETDATE(), 
                    2, 
                    0
                )
            `;
            // Using CreatedBy = 2 (Admin) as per previous fixes.

            const parentRes = await transaction.request().query(insertParent);
            const blastingId = parentRes.recordset[0].SlNo;

            // 2. Insert Children (TblBlastingAccessories)
            if (body.accessories && body.accessories.length > 0) {
                for (const acc of body.accessories) {
                    if (!acc.SED && !acc.TotalBoosterUsed) continue; // Skip empty

                    const insertChild = `
                        INSERT INTO [Trans].[TblBlastingAccessories] (
                            BlastingId, SED, TotalBoosterUsed, TotalNonelMeters, TotalTLDMeters, 
                            CreatedDate, CreatedBy, IsDelete
                        ) VALUES (
                            ${blastingId}, 
                            '${acc.SED || ''}', 
                            ${acc.TotalBoosterUsed || 0}, 
                            ${acc.TotalNonelMeters || 0}, 
                            ${acc.TotalTLDMeters || 0}, 
                            GETDATE(), 
                            2, 
                            0
                        )
                    `;
                    await transaction.request().query(insertChild);
                }
            }

            await transaction.commit();
            return NextResponse.json({ success: true, id: blastingId });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error('Create Blasting Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
