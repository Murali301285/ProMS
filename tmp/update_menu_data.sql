-- 0. Fix Identity Seed (Sync with Max ID)
DBCC CHECKIDENT ('[Master].[TblMenuMaster]', RESEED);
GO

-- 1. Ensure Remarks in TblRole
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblRole' AND COLUMN_NAME = 'Remarks')
BEGIN
    ALTER TABLE [Master].[TblRole] ADD [Remarks] NVARCHAR(MAX) NULL;
END
GO

-- 2. Update 'User' Menu (Id 30)
UPDATE [Master].[TblMenuMaster]
SET Menuname = 'User Management', Url = '/dashboard/settings/user-management/user', IsActive = 1
WHERE MenuId = 30;
GO

-- 3. Insert 'Role Master' if missing
IF NOT EXISTS (SELECT * FROM [Master].[TblMenuMaster] WHERE Url = '/dashboard/settings/user-management/role')
BEGIN
    INSERT INTO [Master].[TblMenuMaster] (Menuname, Url, Icon, Parentid, Sortby, IsActive, Ismenu, IsDelete, IsMobile)
    VALUES ('Role Master', '/dashboard/settings/user-management/role', 'UserCog', 27, 2, 1, 1, 0, 0);
END
GO

-- 4. Insert 'Role Authorization' if missing
IF NOT EXISTS (SELECT * FROM [Master].[TblMenuMaster] WHERE Url = '/dashboard/settings/user-management/authorization')
BEGIN
    INSERT INTO [Master].[TblMenuMaster] (Menuname, Url, Icon, Parentid, Sortby, IsActive, Ismenu, IsDelete, IsMobile)
    VALUES ('Role Authorization', '/dashboard/settings/user-management/authorization', 'ShieldCheck', 27, 3, 1, 1, 0, 0);
END
GO
