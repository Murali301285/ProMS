USE [ProdMS_live];
GO

-- =============================================
-- REGISTER PAGES IN TblPage (So they appear in Menu Allocation)
-- Run this if you don't see the new masters in "Available Sub Menus"
-- =============================================

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Master].[TblPage]') AND type in (N'U'))
BEGIN
    INSERT INTO [Master].[TblPage] (PageName, PagePath, CreatedBy)
    SELECT NewPages.PageName, NewPages.PagePath, 'System'
    FROM (VALUES 
        ('Company', '/dashboard/master/company'),
        ('Activity', '/dashboard/master/activity'),
        ('Depth Slab', '/dashboard/master/depth-slab'),
        ('Destination', '/dashboard/master/destination'),
        ('Dest-Material Map', '/dashboard/master/destination-material-mapping'),
        ('Entry Type', '/dashboard/master/entry-type'),
        ('Equipment Group', '/dashboard/master/equipment-group'),
        ('Equipment', '/dashboard/master/equipment'),
        ('Location', '/dashboard/master/location'),
        ('Material', '/dashboard/master/material'),
        ('Method', '/dashboard/master/method'),
        ('Operator', '/dashboard/master/operator'),
        ('Patch', '/dashboard/master/patch'),
        ('Plant', '/dashboard/master/plant'),
        ('Qty/Trip Map', '/dashboard/master/qty-trip-mapping'),
        ('Relay', '/dashboard/master/relay'),
        ('Scale', '/dashboard/master/scale'),
        ('Sector', '/dashboard/master/sector'),
        ('Shift', '/dashboard/master/shift'),
        ('Shift Incharge', '/dashboard/master/shift-incharge'),
        ('SME Supplier', '/dashboard/master/sme-supplier'),
        ('Source', '/dashboard/master/source'),
        ('Stoppage Reason', '/dashboard/master/stoppage-reason'),
        ('Strata', '/dashboard/master/strata'),
        ('Unit', '/dashboard/master/unit')
    ) AS NewPages(PageName, PagePath)
    WHERE NOT EXISTS (SELECT 1 FROM [Master].[TblPage] p WHERE p.PagePath = NewPages.PagePath);
    
    PRINT 'Pages inserted successfully.';
END
ELSE
BEGIN
    PRINT 'Error: [Master].[TblPage] table not found.';
END
GO
