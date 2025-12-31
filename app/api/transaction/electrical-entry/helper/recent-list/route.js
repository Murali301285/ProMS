
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
    try {
        const session = await authenticateUser(request);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.id;
        const body = await request.json();
        const { skip = 0, take = 50 } = body;

        // Query: 
        // - Filter by User
        // - Filter by Date (From Body)
        // - Fetch ALL fields including names for ID columns

        let query = `
            SELECT 
                T.SlNo,
                T.[Date],
                T.ShiftId,
                S.ShiftName,
                
                T.RelayId,
                R.Name as RelayName,
                
                T.Type,
                
                T.EquipmentId,
                E.EquipmentName,
                
                T.PlantId,
                P.Name as PlantName,
                
                -- Dynamic Name based on Type (for Table display)
                -- If Type is 'Equipment', show EquipmentName, else PlantName
                CASE 
                    WHEN T.Type = 'Equipment' THEN E.EquipmentName 
                    ELSE P.Name 
                END as EntityName,
                
                -- Also return dedicated EquipmentName column for table as per config
                COALESCE(E.EquipmentName, P.Name) as EquipmentName, -- Overloaded for 'Equipment/Plant' column

                T.OMR,
                T.CMR,
                T.TotalUnit,
                
                T.UnitId,
                U.Name as UnitName,
                
                T.Remarks,

                CU.UserName as CreatedByName,
                T.CreatedDate,
                UU.UserName as UpdatedByName,
                T.UpdatedDate

            FROM [Trans].[TblElectricalEntry] T
            LEFT JOIN [Master].[TblShift] S ON T.ShiftId = S.SlNo
            LEFT JOIN [Master].[TblRelay] R ON T.RelayId = R.SlNo
            LEFT JOIN [Master].[TblEquipment] E ON T.EquipmentId = E.SlNo
            LEFT JOIN [Master].[TblPlant] P ON T.PlantId = P.SlNo
            LEFT JOIN [Master].[TblUnit] U ON T.UnitId = U.SlNo
            LEFT JOIN [Master].[TblUser_New] CU ON T.CreatedBy = CU.SlNo
            LEFT JOIN [Master].[TblUser_New] UU ON T.UpdatedBy = UU.SlNo
            
            WHERE T.IsDelete = 0
            AND (T.CreatedBy = @userId OR T.UpdatedBy = @userId)
        `;

        const params = [{ name: 'userId', type: sql.Int, value: userId }];

        // Filters
        if (body.Date) {
            query += ` AND CAST(T.[Date] AS DATE) = @date`;
            params.push({ name: 'date', type: sql.Date, value: body.Date });
        }

        // Optional Shift Filter
        if (body.ShiftId) {
            query += ` AND T.ShiftId = @shiftId`;
            params.push({ name: 'shiftId', type: sql.Int, value: body.ShiftId });
        }

        // Sorting
        query += ` ORDER BY T.SlNo DESC OFFSET @skip ROWS FETCH NEXT @take ROWS ONLY`;
        params.push({ name: 'skip', type: sql.Int, value: skip });
        params.push({ name: 'take', type: sql.Int, value: take });

        const data = await executeQuery(query, params);

        return NextResponse.json({ data });

    } catch (error) {
        console.error("Electrical Recent List Error:", error);
        return NextResponse.json({ message: 'Error fetching list', error: error.message }, { status: 500 });
    }
}
