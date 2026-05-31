-- Bulk Page & Menu Registration Script without SCOPE_IDENTITY()
-- Processes items one-by-one, handles errors, records status/remarks, and displays execution summary.

-- 1. Create a temporary table of pages to register
IF OBJECT_ID('tempdb..#PagesToRegister') IS NOT NULL DROP TABLE #PagesToRegister;
CREATE TABLE #PagesToRegister (
    PageName NVARCHAR(100),
    PagePath NVARCHAR(100),
    ModuleName NVARCHAR(100),
    RoleName NVARCHAR(100),
    IsView BIT,
    IsAdd BIT,
    IsEdit BIT,
    IsDelete BIT
);

-- Populate pages to register
INSERT INTO #PagesToRegister (PageName, PagePath, ModuleName, RoleName, IsView, IsAdd, IsEdit, IsDelete)
VALUES 
('Filling Point', '/dashboard/master/filling-point', 'Master', 'Admin', 1, 1, 1, 1),
('Filling Pump', '/dashboard/master/filling-pump', 'Master', 'Admin', 1, 1, 1, 1),
('Water Tanker Entry', '/dashboard/transaction/water-tanker-entry', 'Transaction', 'Admin', 1, 1, 1, 1),
('Water Tanker Entry Report', '/dashboard/reports/water-tanker-entry', 'Reports', 'Admin', 1, 0, 0, 0),
('Drilling & Blasting', '/dashboard/drilling-blasting', 'Dashboard', 'Admin', 1, 1, 1, 1),
('Crushing', '/dashboard/crushing', 'Dashboard', 'Admin', 1, 1, 1, 1),
('Fuel Type', '/dashboard/master/fuel-type', 'Master', 'Admin', 1, 1, 1, 1);

-- 2. Create table to track execution status
IF OBJECT_ID('tempdb..#RegistrationStatus') IS NOT NULL DROP TABLE #RegistrationStatus;
CREATE TABLE #RegistrationStatus (
    PageName NVARCHAR(100),
    PagePath NVARCHAR(100),
    Status NVARCHAR(50),
    Remarks NVARCHAR(MAX)
);

-- 3. Process each page one-by-one
DECLARE @PageName NVARCHAR(100);
DECLARE @PagePath NVARCHAR(100);
DECLARE @ModuleName NVARCHAR(100);
DECLARE @RoleName NVARCHAR(100);
DECLARE @IsView BIT;
DECLARE @IsAdd BIT;
DECLARE @IsEdit BIT;
DECLARE @IsDelete BIT;

DECLARE @ModuleId INT;
DECLARE @PageId INT;
DECLARE @RoleId INT;
DECLARE @SortOrder INT;

DECLARE PageCursor CURSOR FOR 
SELECT PageName, PagePath, ModuleName, RoleName, IsView, IsAdd, IsEdit, IsDelete
FROM #PagesToRegister;

OPEN PageCursor;
FETCH NEXT FROM PageCursor INTO @PageName, @PagePath, @ModuleName, @RoleName, @IsView, @IsAdd, @IsEdit, @IsDelete;

WHILE @@FETCH_STATUS = 0
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        -- A. Find Module ID
        SELECT TOP 1 @ModuleId = SlNo 
        FROM [Master].[TblModule] 
        WHERE ModuleName = @ModuleName OR ModuleName LIKE '%' + @ModuleName + '%';

        IF @ModuleId IS NULL
        BEGIN
            THROW 50001, 'Module not found', 1;
        END

        -- B. Find Role ID
        SELECT TOP 1 @RoleId = SlNo 
        FROM [Master].[TblRole_New] 
        WHERE RoleName = @RoleName OR RoleName LIKE '%' + @RoleName + '%';

        IF @RoleId IS NULL
        BEGIN
            THROW 50002, 'Role not found', 1;
        END

        -- C. Insert/Get Page (Do not rely on SCOPE_IDENTITY() inside script, query manually)
        IF NOT EXISTS (SELECT 1 FROM [Master].[TblPage] WHERE PagePath = @PagePath)
        BEGIN
            INSERT INTO [Master].[TblPage] (PageName, PagePath, IsActive, IsDelete, CreatedBy, CreatedDate)
            VALUES (@PageName, @PagePath, 1, 0, 'System', GETDATE());
        END

        -- Query manually instead of SCOPE_IDENTITY()
        SELECT @PageId = SlNo FROM [Master].[TblPage] WHERE PagePath = @PagePath;

        IF @PageId IS NULL
        BEGIN
            THROW 50003, 'Failed to insert or locate Page ID', 1;
        END

        -- D. Menu Allocation
        IF NOT EXISTS (SELECT 1 FROM [Master].[TblMenuAllocation] WHERE PageId = @PageId AND ModuleId = @ModuleId)
        BEGIN
            SELECT @SortOrder = ISNULL(MAX(SortOrder), 0) + 1 
            FROM [Master].[TblMenuAllocation] 
            WHERE ModuleId = @ModuleId;

            INSERT INTO [Master].[TblMenuAllocation] (ModuleId, SubGroupId, PageId, SortOrder, IsActive, IsDelete, CreatedBy, CreatedDate)
            VALUES (@ModuleId, NULL, @PageId, @SortOrder, 1, 0, 'System', GETDATE());
        END

        -- E. Role Authorization
        IF NOT EXISTS (SELECT 1 FROM [Master].[TblRoleAuthorization_New] WHERE RoleId = @RoleId AND PageId = @PageId)
        BEGIN
            INSERT INTO [Master].[TblRoleAuthorization_New] (RoleId, PageId, IsView, IsAdd, IsEdit, IsDelete, IsActive, CreatedDate)
            VALUES (@RoleId, @PageId, @IsView, @IsAdd, @IsEdit, @IsDelete, 1, GETDATE());
        END
        ELSE
        BEGIN
            -- Update authorization if it exists
            UPDATE [Master].[TblRoleAuthorization_New]
            SET IsView = @IsView, IsAdd = @IsAdd, IsEdit = @IsEdit, IsDelete = @IsDelete, IsActive = 1
            WHERE RoleId = @RoleId AND PageId = @PageId;
        END

        COMMIT TRANSACTION;

        INSERT INTO #RegistrationStatus (PageName, PagePath, Status, Remarks)
        VALUES (@PageName, @PagePath, 'SUCCESS', 'Registered and allocated successfully');

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        INSERT INTO #RegistrationStatus (PageName, PagePath, Status, Remarks)
        VALUES (@PageName, @PagePath, 'FAILED', ERROR_MESSAGE());
    END CATCH;

    FETCH NEXT FROM PageCursor INTO @PageName, @PagePath, @ModuleName, @RoleName, @IsView, @IsAdd, @IsEdit, @IsDelete;
END;

CLOSE PageCursor;
DEALLOCATE PageCursor;

-- 4. Display Status Matrix
SELECT PageName, PagePath, Status, Remarks 
FROM #RegistrationStatus;

-- 5. Display Summary
SELECT 
    COUNT(*) as TotalAttempted,
    SUM(CASE WHEN Status = 'SUCCESS' THEN 1 ELSE 0 END) as SuccessCount,
    SUM(CASE WHEN Status = 'FAILED' THEN 1 ELSE 0 END) as FailureCount
FROM #RegistrationStatus;

-- Clean up
DROP TABLE #PagesToRegister;
DROP TABLE #RegistrationStatus;
