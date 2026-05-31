-- =================================================================================
-- ROBUST BULK PAGE & MENU REGISTRATION SCRIPT (WITHOUT SCOPE_IDENTITY)
-- =================================================================================
-- Description:
-- Processes a list of pages one-by-one using a Cursor.
-- For each page, it:
--   1. Finds the corresponding Module ID and Role ID.
--   2. Inserts or finds the Page ID without relying on SCOPE_IDENTITY() (using manual lookup).
--   3. Allocates the page to the module menu.
--   4. Grants permissions to the targeted Role (inserts or updates authorization).
--   5. Implements Try-Catch, handles errors, rollbacks transaction on failure,
--      and records status ('SUCCESS' / 'FAILED') and error message in a remarks column.
--   6. Displays a final execution matrix and a counts summary at the end.
-- =================================================================================

SET NOCOUNT ON;

-- 1. Declare the pages to register (Define your list here)
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

-- Populate pages list (Change these as needed for your scope!)
INSERT INTO #PagesToRegister (PageName, PagePath, ModuleName, RoleName, IsView, IsAdd, IsEdit, IsDelete)
VALUES 
('Filling Point', '/dashboard/master/filling-point', 'Master', 'Admin', 1, 1, 1, 1),
('Filling Pump', '/dashboard/master/filling-pump', 'Master', 'Admin', 1, 1, 1, 1),
('Water Tanker Entry', '/dashboard/transaction/water-tanker-entry', 'Transaction', 'Admin', 1, 1, 1, 1),
('Water Tanker Entry Report', '/dashboard/reports/water-tanker-entry', 'Reports', 'Admin', 1, 0, 0, 0),
('Drilling & Blasting', '/dashboard/drilling-blasting', 'Dashboard', 'Admin', 1, 1, 1, 1),
('Crushing', '/dashboard/crushing', 'Dashboard', 'Admin', 1, 1, 1, 1),
('Fuel Type', '/dashboard/master/fuel-type', 'Master', 'Admin', 1, 1, 1, 1);

-- 2. Create tracking table to log execution status
IF OBJECT_ID('tempdb..#RegistrationStatus') IS NOT NULL DROP TABLE #RegistrationStatus;
CREATE TABLE #RegistrationStatus (
    PageName NVARCHAR(100),
    PagePath NVARCHAR(100),
    Status NVARCHAR(50),
    Remarks NVARCHAR(MAX)
);

-- 3. Declare loop variables
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

-- 4. Open Cursor to process items one-by-one
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

        -- Manual lookup instead of relying on SCOPE_IDENTITY() to prevent database scope clashes
        SELECT @PageId = SlNo 
        FROM [Master].[TblPage] 
        WHERE PagePath = @PagePath;

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
            -- Update authorization parameters if it already exists
            UPDATE [Master].[TblRoleAuthorization_New]
            SET IsView = @IsView, IsAdd = @IsAdd, IsEdit = @IsEdit, IsDelete = @IsDelete, IsActive = 1
            WHERE RoleId = @RoleId AND PageId = @PageId;
        END

        COMMIT TRANSACTION;

        -- Record Success Status
        INSERT INTO #RegistrationStatus (PageName, PagePath, Status, Remarks)
        VALUES (@PageName, @PagePath, 'SUCCESS', 'Registered and allocated successfully');

    END TRY
    BEGIN CATCH
        -- Rollback active transaction if an error occurs to maintain consistency
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Record Failure Status and the exact SQL error message
        INSERT INTO #RegistrationStatus (PageName, PagePath, Status, Remarks)
        VALUES (@PageName, @PagePath, 'FAILED', ERROR_MESSAGE());
    END CATCH;

    FETCH NEXT FROM PageCursor INTO @PageName, @PagePath, @ModuleName, @RoleName, @IsView, @IsAdd, @IsEdit, @IsDelete;
END;

CLOSE PageCursor;
DEALLOCATE PageCursor;

-- =================================================================================
-- RESULTS REPORTING
-- =================================================================================

-- 1. Detailed Execution Matrix
SELECT PageName, PagePath, Status, Remarks 
FROM #RegistrationStatus;

-- 2. Performance Summary
SELECT 
    COUNT(*) as TotalAttempted,
    SUM(CASE WHEN Status = 'SUCCESS' THEN 1 ELSE 0 END) as SuccessCount,
    SUM(CASE WHEN Status = 'FAILED' THEN 1 ELSE 0 END) as FailureCount
FROM #RegistrationStatus;

-- Cleanup Temp Tables
DROP TABLE #PagesToRegister;
DROP TABLE #RegistrationStatus;
