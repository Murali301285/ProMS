
import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const pool = await getDbConnection();
        await pool.request().query(`UPDATE [Trans].[TblBlasting] SET IsDelete = 1 WHERE SlNo = ${id}`);
        return NextResponse.json({ success: true });
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

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const { id } = await params;
    try {
        const body = await request.json();
        const pool = await getDbConnection();
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            // Update Parent
            await transaction.request().query(`
                UPDATE [Trans].[TblBlasting] SET
                    Date = '${body.Date}',
                    BlastingPatchId = '${body.BlastingPatchId}',
                    SMESupplierId = ${body.SMESupplierId},
                    SMEQty = ${body.SMEQty || 0},
                    MaxChargeHole = ${body.MaxCharge || 0},
                    PPV = ${body.PPV || 0},
                    NoofHolesDeckCharged = ${body.DeckHoles || 0},
                    NoofWetHole = ${body.WetHoles || 0},
                    AirPressure = ${body.AirPressure || 0},
                    TotalExplosiveUsed = ${body.TotalExplosiveUsed || 0},
                    Remarks = '${body.Remarks || ''}',
                    UpdatedBy = 2,
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
                            2, 
                            0
                        )
                    `);
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
