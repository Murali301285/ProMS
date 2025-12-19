-- 1. Create RoleAuthorization Table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblRoleAuthorization')
BEGIN
CREATE TABLE [Master].[TblRoleAuthorization](
	[Permissionid] [int] IDENTITY(1,1) NOT NULL,
	[RoleId] [int] NULL,
	[MenuId] [int] NULL,
	[IsView] [bit] NOT NULL,
	[IsAdd] [bit] NOT NULL,
	[IsEdit] [bit] NOT NULL,
	[IsDelete] [bit] NOT NULL,
	[CreatedBy] [int] NULL,
	[CreatedDate] [datetime] NULL,
	[UpdatedBy] [int] NULL,
	[UpdatedDate] [datetime] NULL,
	[IsDeleted] [bit] NOT NULL,
	[IsActive] [bit] NOT NULL,
 CONSTRAINT [PK_TblRoleAuthorization] PRIMARY KEY CLUSTERED 
(
	[Permissionid] ASC
)
)

ALTER TABLE [Master].[TblRoleAuthorization] ADD  DEFAULT ((1)) FOR [IsActive]
END
GO

-- 2. Add Remarks to TblRole if missing
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblRole' AND COLUMN_NAME = 'Remarks')
BEGIN
    ALTER TABLE [Master].[TblRole] ADD [Remarks] NVARCHAR(MAX) NULL;
END
GO

-- 3. Populate TblMenuMaster (Clean Slate for Layout)
-- Existing Schema: MenuId, Menuname, Controller, Method, Icon, Module, Url, Parentid, Ismenu, Sortby, Createdate, IsDelete, IsMobile, IsActive

DELETE FROM [Master].[TblMenuMaster];
DBCC CHECKIDENT ('[Master].[TblMenuMaster]', RESEED, 0);

-- Insert Parents
INSERT INTO [Master].[TblMenuMaster] (Menuname, Url, Icon, Parentid, Sortby, IsActive, Ismenu, IsDelete, IsMobile) VALUES 
('Dashboard', '/dashboard', 'LayoutDashboard', 0, 1, 1, 1, 0, 0),
('Transaction', NULL, 'NotebookPen', 0, 2, 1, 1, 0, 0),
('Consumptions', NULL, 'Fuel', 0, 3, 1, 1, 0, 0),
('Reports', NULL, 'FileBarChart', 0, 4, 1, 1, 0, 0),
('Masters', NULL, 'Database', 0, 5, 1, 1, 0, 0),
('Settings', NULL, 'Settings', 0, 6, 1, 1, 0, 0);

-- Insert Children (Transaction) - ParentId 2
INSERT INTO [Master].[TblMenuMaster] (Menuname, Url, Icon, Parentid, Sortby, IsActive, Ismenu, IsDelete, IsMobile) VALUES 
('Loading From Mines', '/dashboard/transaction/loading-from-mines', 'Truck', 2, 1, 1, 1, 0, 0),
('Dispatch Entry', '/dashboard/transaction/dispatch-entry/list', 'Truck', 2, 2, 1, 1, 0, 0),
('BDS Entry', '/dashboard/transaction/bds-entry/list', 'ClipboardCheck', 2, 3, 1, 1, 0, 0),
('Equipment Reading', '/dashboard/transaction/equipment-reading', 'Gauge', 2, 4, 1, 1, 0, 0),
('Drill Entry', '/dashboard/transaction/drilling', 'Drill', 2, 5, 1, 1, 0, 0),
('Blast Entry', '/dashboard/transaction/blasting/list', 'Explosion', 2, 6, 1, 1, 0, 0),
('Crusher Entry', '/dashboard/transaction/crusher/list', 'Cog', 2, 7, 1, 1, 0, 0),
('Material Rehandling', '/dashboard/transaction/material-rehandling', 'RefreshCw', 2, 8, 1, 1, 0, 0),
('Electrical/Unit Entry', '/dashboard/transaction/electrical-entry', 'Zap', 2, 9, 1, 1, 0, 0);

-- Insert Children (Masters) - ParentId 5
INSERT INTO [Master].[TblMenuMaster] (Menuname, Url, Icon, Parentid, Sortby, IsActive, Ismenu, IsDelete, IsMobile) VALUES 
('Party Master', '/dashboard/master/party', 'Users', 5, 1, 1, 1, 0, 0),
('Location Master', '/dashboard/master/location', 'MapPin', 5, 2, 1, 1, 0, 0),
('Equipment Master', '/dashboard/master/equipment', 'Tractor', 5, 3, 1, 1, 0, 0),
('Material Master', '/dashboard/settings/destination-material', 'Package', 5, 4, 1, 1, 0, 0);

-- Insert Children (Settings) - ParentId 6
INSERT INTO [Master].[TblMenuMaster] (Menuname, Url, Icon, Parentid, Sortby, IsActive, Ismenu, IsDelete, IsMobile) VALUES 
('User Management', '/dashboard/settings/user-management', 'UserCog', 6, 1, 1, 1, 0, 0);
GO
