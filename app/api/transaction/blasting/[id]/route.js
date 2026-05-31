export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function DELETE(request, { params }) {
    try {
        const user = await authenticateUser(request);
        const { id } = await params;
        const pool = await getDbConnection();
        // Use parameterized query
        const result = await pool.request()
            .input('id', id)
            .input('userId', user ? user.id : 1)
            .query(`UPDATE [Trans].[TblBlasting] SET IsDelete = 1, UpdatedBy = @userId, UpdatedDate = GETDATE() OUTPUT INSERTED.SlNo WHERE SlNo = @id`);

        if (result.recordset && result.recordset.length > 0) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Record not found or already deleted' }, { status: 404 });
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const pool = await getDbConnection();

        const result = await pool.request().query(`
            SELECT * FROM [Trans].[TblBlasting] WHERE SlNo = ${id} AND IsDelete = 0
        `);

        if (result.recordset.length === 0) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        const data = result.recordset[0];
        // Normalize names to match Form
        data.PatchId = data.BlastingPatchId;
        data.MaxCharge = data.MaxChargeHole;
        data.DeckHoles = data.NoofHolesDeckCharged;
        data.WetHoles = data.NoofWetHole;

        // Accessories
        const accRes = await pool.request().query(`
            SELECT * FROM [Trans].[TblBlastingAccessories] WHERE BlastingId = ${id} AND IsDelete = 0
        `);
        data.accessories = accRes.recordset;

        // SME Suppliers & Entries Grouping
        const smeRes = await pool.request().query(`
            SELECT * FROM [Trans].[TblBlastingSME] WHERE BlastingId = ${id} AND IsDelete = 0
        `);
        
        // Rebuild nested entries
        const flatSMEs = smeRes.recordset;
        const entryMap = new Map();
        
        flatSMEs.forEach(row => {
            const entryKey = `${row.RefName}_${row.EntryNoOfHoles}_${row.EntryRemarks}`;
            if (!entryMap.has(entryKey)) {
                entryMap.set(entryKey, {
                    id: Math.random(),
                    refName: row.RefName || '',
                    noOfHoles: row.EntryNoOfHoles || '',
                    remarks: row.EntryRemarks || '',
                    smeSuppliers: []
                });
            }
            if (row.SMESupplierId) {
                entryMap.get(entryKey).smeSuppliers.push({
                    id: Math.random(),
                    SMESupplierId: row.SMESupplierId,
                    SMEQty: row.SMEQty,
                    remarks: row.SMERemarks || ''
                });
            }
        });

        // Legacy support: If entryMap is empty but we have data (from legacy without RefName)
        if (entryMap.size === 0 && flatSMEs.length > 0) {
            data.entries = [{
                id: Math.random(),
                refName: 'Legacy',
                noOfHoles: data.parent.NoofHoles || '',
                remarks: '',
                smeSuppliers: flatSMEs.map(r => ({
                    id: Math.random(),
                    SMESupplierId: r.SMESupplierId,
                    SMEQty: r.SMEQty,
                    remarks: r.SMERemarks || ''
                }))
            }];
        } else {
            // Check if any entry has empty suppliers, provide an empty row
            data.entries = Array.from(entryMap.values()).map(e => {
                if (e.smeSuppliers.length === 0) {
                    e.smeSuppliers = [{ id: Math.random(), SMESupplierId: '', SMEQty: '', remarks: '' }];
                }
                return e;
            });
        }


        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const { id } = await params;
    try {
        const body = await request.json();
        const user = await authenticateUser(request);
        const userId = user ? user.id : 1;

        const pool = await getDbConnection();
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            // Update Parent
            await transaction.request().query(`
                UPDATE [Trans].[TblBlasting] SET
                    Date = '${body.Date}',
                    BlastingPatchId = '${body.BlastingPatchId}',
                    SMESupplierId = NULL,
                    SMEQty = NULL,
                    MaxChargeHole = ${body.MaxCharge || 0},
                    PPV = ${body.PPV || 0},
                    NoofHolesDeckCharged = ${body.DeckHoles || 0},
                    NoofWetHole = ${body.WetHoles || 0},
                    AirPressure = ${body.AirPressure || 0},
                    TotalExplosiveUsed = ${body.TotalExplosiveUsed || 0},
                    Remarks = '${body.Remarks || ''}',
                    UpdatedBy = ${userId},
                    UpdatedDate = GETDATE()
                WHERE SlNo = ${id}
            `);

            // Update Children: Hard Delete and Re-insert or intelligent update?
            // Easiest reliable way: Soft Delete all current, Insert new. 
            // Or Delete existing physically? soft delete is 'standard'.

            // 1. Soft delete old accessories
            await transaction.request().query(`
                UPDATE [Trans].[TblBlastingAccessories] SET IsDelete = 1 WHERE BlastingId = ${id}
            `);

            // 2. Insert new
            if (body.accessories && body.accessories.length > 0) {
                for (const acc of body.accessories) {
                    if (!acc.SED && !acc.TotalBoosterUsed) continue;

                    await transaction.request().query(`
                        INSERT INTO [Trans].[TblBlastingAccessories] (
                            BlastingId, SED, TotalBoosterUsed, TotalNonelMeters, TotalTLDMeters, 
                            CreatedDate, CreatedBy, IsDelete
                        ) VALUES (
                            ${id}, 
                            '${acc.SED || ''}', 
                            ${acc.TotalBoosterUsed || 0}, 
                            ${acc.TotalNonelMeters || 0}, 
                            ${acc.TotalTLDMeters || 0}, 
                            GETDATE(), 
                            GETDATE(), 
                            ${userId}, 
                            0
                        )
                    `);
                }
            }

            // 3. Update SME Suppliers
            await transaction.request().query(`
                UPDATE [Trans].[TblBlastingSME] SET IsDelete = 1 WHERE BlastingId = ${id}
            `);

            if (body.entries && body.entries.length > 0) {
                for (const entry of body.entries) {
                    if (!entry.smeSuppliers || entry.smeSuppliers.length === 0) {
                        await transaction.request().query(`
                            INSERT INTO [Trans].[TblBlastingSME] (
                                BlastingId, SMESupplierId, SMEQty, 
                                RefName, EntryNoOfHoles, EntryRemarks, SMERemarks,
                                CreatedDate, CreatedBy, IsDelete
                            ) VALUES (
                                ${id}, 
                                NULL, 
                                0, 
                                '${entry.refName || ''}',
                                ${entry.noOfHoles || 0},
                                '${entry.remarks || ''}',
                                '',
                                GETDATE(), 
                                ${userId}, 
                                0
                            )
                        `);
                    } else {
                        for (const sme of entry.smeSuppliers) {
                            if (!sme.SMESupplierId && !entry.refName) continue;
                            
                            await transaction.request().query(`
                                INSERT INTO [Trans].[TblBlastingSME] (
                                    BlastingId, SMESupplierId, SMEQty, 
                                    RefName, EntryNoOfHoles, EntryRemarks, SMERemarks,
                                    CreatedDate, CreatedBy, IsDelete
                                ) VALUES (
                                    ${id}, 
                                    ${sme.SMESupplierId ? sme.SMESupplierId : 'NULL'}, 
                                    ${sme.SMEQty || 0}, 
                                    '${entry.refName || ''}',
                                    ${entry.noOfHoles || 0},
                                    '${entry.remarks || ''}',
                                    '${sme.remarks || ''}',
                                    GETDATE(), 
                                    ${userId}, 
                                    0
                                )
                            `);
                        }
                    }
                }
            }

            await transaction.commit();
            return NextResponse.json({ success: true });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
