import { sql } from '@/lib/db';
import { executeQuery } from '@/lib/db';
import crypto from 'crypto';

const LEGACY_KEY_STRING = "rytTHh42t5Aagite95R95erktlwe454asR1254fase5454un5g45Ka8vg54d45Sa5astg";

function encryptPassword(password) {
    try {
        const md5Hash = crypto.createHash('md5').update(LEGACY_KEY_STRING, 'utf8').digest();
        const key = Buffer.concat([md5Hash, md5Hash.slice(0, 8)]); // Expand to 24 bytes

        const cipher = crypto.createCipheriv('des-ede3-ecb', key, null);
        cipher.setAutoPadding(true);

        let encrypted = cipher.update(password, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    } catch (error) {
        console.error("Encryption error:", error);
        return null; // Fail safe
    }
}

export async function verifyUser(username, password) {
    // 1. Fetch user from DB
    const query = `
        SELECT u.SlNo, u.UserName, u.Password, u.RoleId, r.RoleName 
        FROM [Master].[TblUser_New] u
        LEFT JOIN [Master].[TblRole_New] r ON u.RoleId = r.SlNo
        WHERE u.UserName = @username AND u.IsDelete = 0
    `;

    const users = await executeQuery(query, [
        { name: 'username', type: sql.VarChar, value: username }
    ]);

    if (!users || users.length === 0) {
        return null;
    }

    const user = users[0];

    // 2. Validate Password (Using Legacy 3DES Encryption)
    const encryptedInput = encryptPassword(password);

    // Check against encrypted password OR plan-text (fallback for old test users)
    const isValid = (user.Password === encryptedInput) || (user.Password === password);

    if (!isValid) return null;

    return {
        id: user.SlNo,
        username: user.UserName,
        role: user.RoleName || 'User',
        roleId: user.RoleId
    };
}
