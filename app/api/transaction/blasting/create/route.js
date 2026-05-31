export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
    try {
        const body = await request.json();
        const pool = await getDbConnection();
        const transaction = new sql.Transaction(pool);

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

            const user = await authenticateUser(request);
            let createdBy = user ? user.id : 1;

            const valOrNull = (v) => (v === '' || v === null || v === undefined) ? 'NULL' : v;

            const insertParent = `
                INSERT INTO [Trans].[TblBlasting] (
                    Date, BlastingPatchId, SMESupplierId, SMEQty, 
                    MaxChargeHole, PPV, NoofHolesDeckCharged, NoofWetHole, AirPressure, 
                    TotalExplosiveUsed, Remarks, CreatedDate, CreatedBy, IsDelete
                ) OUTPUT INSERTED.SlNo VALUES (
                    '${body.Date}', 
                    '${body.BlastingPatchId}', 
                    NULL, 
                    NULL, 
                    ${valOrNull(body.MaxCharge)}, 
                    ${valOrNull(body.PPV)}, 
                    ${valOrNull(body.DeckHoles)}, 
                    ${valOrNull(body.WetHoles)}, 
                    ${valOrNull(body.AirPressure)}, 
                    ${valOrNull(body.TotalExplosiveUsed)}, 
                    '${body.Remarks || ''}', 
                    GETDATE(), 
                    ${createdBy}, 
                    0
                )
            `;
            // Using CreatedBy = UserName mapped from body

            console.log('\n--- CREATING NEW BLASTING ENTRY ---');
            console.log('REQUEST BODY:', JSON.stringify(body, null, 2));
            console.log('SQL QUERY (Parent):', insertParent);

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
                            ${createdBy}, 
                            0
                        )
                    `;
                    console.log('SQL QUERY (Child Accessory):', insertChild);
                    await transaction.request().query(insertChild);
                }
            }

            // 3. Insert SME Suppliers (TblBlastingSME)
            if (body.entries && body.entries.length > 0) {
                for (const entry of body.entries) {
                    if (!entry.smeSuppliers || entry.smeSuppliers.length === 0) {
                        // Insert entry without SME supplier
                        const insertSME = `
                            INSERT INTO [Trans].[TblBlastingSME] (
                                BlastingId, SMESupplierId, SMEQty, 
                                RefName, EntryNoOfHoles, EntryRemarks, SMERemarks,
                                CreatedDate, CreatedBy, IsDelete
                            ) VALUES (
                                ${blastingId}, 
                                NULL, 
                                0, 
                                '${entry.refName || ''}',
                                ${entry.noOfHoles || 0},
                                '${entry.remarks || ''}',
                                '',
                                GETDATE(), 
                                ${createdBy}, 
                                0
                            )
                        `;
                        await transaction.request().query(insertSME);
                    } else {
                        for (const sme of entry.smeSuppliers) {
                            if (!sme.SMESupplierId && !entry.refName) continue; // Skip totally empty
                            
                            const insertSME = `
                                INSERT INTO [Trans].[TblBlastingSME] (
                                    BlastingId, SMESupplierId, SMEQty, 
                                    RefName, EntryNoOfHoles, EntryRemarks, SMERemarks,
                                    CreatedDate, CreatedBy, IsDelete
                                ) VALUES (
                                    ${blastingId}, 
                                    ${sme.SMESupplierId ? sme.SMESupplierId : 'NULL'}, 
                                    ${sme.SMEQty || 0}, 
                                    '${entry.refName || ''}',
                                    ${entry.noOfHoles || 0},
                                    '${entry.remarks || ''}',
                                    '${sme.remarks || ''}',
                                    GETDATE(), 
                                    ${createdBy}, 
                                    0
                                )
                            `;
                            await transaction.request().query(insertSME);
                        }
                    }
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
