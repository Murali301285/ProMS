export const MASTER_CONFIG = {
    company: {
        table: '[Master].[TblCompany]',
        idField: 'SlNo',
        columns: [
            { accessor: 'CompanyName', label: 'Company Name', type: 'text', required: true, autoFocus: true, unique: true },
            { accessor: 'GstNo', label: 'GST No', type: 'text', required: true },
            { accessor: 'Address', label: 'Address', type: 'textarea', required: false },
            { accessor: 'CompanyLogo', label: 'Company Logo', type: 'file', accept: 'image/*', maxSize: 2, required: false }
        ]
    },
    activity: {
        table: '[Master].[TblActivity]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Activity Name', type: 'text', required: true, autoFocus: true, unique: true },
            { accessor: 'IsDetail', label: 'Is Detail', type: 'checkbox' },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    'depth-slab': {
        table: '[Master].[TblDepthSlab]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Depth Slab Name', required: true, autoFocus: true, unique: true },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    destination: {
        table: '[Master].[TblDestination]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Destination Name', required: true, autoFocus: true, unique: true },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    'destination-material-mapping': {
        table: '[Master].[TblDestinationMaterialMapping]',
        idField: 'SlNo',
        columns: [
            { accessor: 'DestinationId', label: 'Destination ID', type: 'number', required: true, autoFocus: true },
            { accessor: 'MaterialId', label: 'Material ID', type: 'number', required: true }
        ]
    },
    'entry-type': {
        table: '[Master].[TblEntryType]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Entry Type Name', required: true, autoFocus: true, unique: true },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    'equipment-group': {
        table: '[Master].[TblEquipmentGroup]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Group Name', required: true, autoFocus: true, unique: true },
            { accessor: 'IsQtyTripMapping', label: 'Qty-Trip-Mapping', templateLabel: 'Qty-Trip-Mapping ( ex value 0/1)', type: 'checkbox', defaultValue: 0 },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    'equipment-owner-type': {
        table: '[Master].[TblEquipmentOwnerType]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Type', label: 'Owner Type', required: true, autoFocus: true, unique: true },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    equipment: {
        table: '[Master].[TblEquipment]',
        idField: 'SlNo',
        columns: [
            { accessor: 'PMSCode', label: 'PMS Code', required: true, autoFocus: true, unique: true, viewOnly: true },
            {
                accessor: 'EquipmentGroupId',
                label: 'Equipment Model',
                type: 'select',
                required: true,
                lookup: { table: 'equipment-group', nameField: 'Name', valueField: 'SlNo' },
                fullRow: true
            },
            { accessor: 'EquipmentName', label: 'Equipment Long Text', required: true, unique: true },
            { accessor: 'EuipmentID', label: 'Equipment Short Text', required: true, unique: true },
            { accessor: 'CostCenter', label: 'Cost Center', unique: true },
            {
                accessor: 'OwnerTypeId',
                label: 'Owner Type',
                type: 'select',
                required: true,
                lookup: { table: 'equipment-owner-type', nameField: 'Type', valueField: 'SlNo' }
            },
            { accessor: 'VendorCode', label: 'Vendor Code' },
            { accessor: 'Model', label: 'Vendor Name' },
            {
                accessor: 'ActivityId',
                label: 'Activity',
                type: 'select',
                lookup: { table: 'activity', nameField: 'Name', valueField: 'SlNo' }
            },
            {
                accessor: 'ScaleId',
                label: 'Scale',
                type: 'select',
                lookup: { table: 'scale', nameField: 'Name', valueField: 'SlNo' }
            },
            { accessor: 'TripQty', label: 'Trip Qty', type: 'number' },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    location: {
        table: '[Master].[TblLocation]',
        idField: 'SlNo',
        bulkUpload: true,
        columns: [
            { accessor: 'LocationName', label: 'Location Name', required: true, autoFocus: true, unique: true, row: 1, colSpan: 2 },
            { accessor: 'Remarks', label: 'Remarks', type: 'textarea', row: 2, colSpan: 2 },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true, row: 3 }
        ]
    },
    material: {
        table: '[Master].[TblMaterial]',
        idField: 'SlNo',
        columns: [
            { accessor: 'MaterialName', label: 'Material Name', required: true, autoFocus: true, unique: true },
            {
                accessor: 'UnitId',
                label: 'Unit',
                type: 'select',
                lookup: { table: 'unit', nameField: 'Name', valueField: 'SlNo' }
            },
            {
                accessor: 'DrillingOutput',
                label: 'Drilling Output',
                type: 'number',
                validationType: 'decimal',
                decimals: 2
            },
            {
                accessor: 'Order',
                label: 'Order',
                type: 'number',
                validationType: 'integer'
            },
            { accessor: 'Remarks', label: 'Remarks', type: 'textarea' },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    method: {
        table: '[Master].[TblMethod]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Method Name', required: true, autoFocus: true, unique: true },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    'OperatorCategory': {
        table: '[Master].[TblOperatorCategory]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Category Name', required: true, autoFocus: true, unique: true }
        ]
    },
    'OperatorSubCategory': {
        table: '[Master].[TblOperatorSubCategory]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Sub Category Name', required: true, autoFocus: true, unique: true }
        ]
    },
    operator: {
        table: '[Master].[TblOperator]',
        idField: 'SlNo',
        bulkUpload: true,
        columns: [
            { accessor: 'OperatorId', label: 'Operator ID', required: true, autoFocus: true, unique: true, row: 1 },
            { accessor: 'OperatorName', label: 'Operator Name', required: true, row: 1 },
            { accessor: 'MobileNo', label: 'Mobile No', row: 2 },
            {
                accessor: 'CategoryId',
                label: 'Category',
                type: 'select',
                required: true,
                lookup: { table: 'OperatorCategory', nameField: 'Name', valueField: 'SlNo' },
                row: 3
            },
            {
                accessor: 'SubCategoryId',
                label: 'Sub Category',
                type: 'select',
                required: true,
                lookup: { table: 'OperatorSubCategory', nameField: 'Name', valueField: 'SlNo' },
                row: 3
            },
            { accessor: 'Remarks', label: 'Remarks', type: 'textarea', row: 4 },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', row: 5, defaultValue: true }
        ]
    },
    patch: {
        table: '[Master].[TblPatch]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Patch Name', required: true, autoFocus: true, unique: true },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    plant: {
        table: '[Master].[TblPlant]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Plant Name', required: true, autoFocus: true, unique: true, row: 1, colSpan: 2 },
            { accessor: 'IsDetails', label: 'Is Details', type: 'checkbox', row: 2 },
            { accessor: 'IsHaulerFieldShow', label: 'Show Hauler Field', type: 'checkbox', row: 2 },
            { accessor: 'IsDPRReport', label: 'Is DPR Report', type: 'checkbox', row: 3 },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true, row: 4 }
        ]
    },
    'qty-trip-mapping': {
        table: '[Master].[TblQtyTripMapping]',
        idField: 'SlNo',
        uniqueConstraint: ['EquipmentGroupId', 'MaterialId'], // Composite uniqueness
        columns: [
            {
                accessor: 'EquipmentGroupId',
                label: 'Equipment Group',
                type: 'select',
                required: true,
                autoFocus: true,
                displayField: 'EquipmentGroupName', // Show Name from API join
                lookup: {
                    table: 'equipment-group',
                    nameField: 'Name',
                    valueField: 'SlNo',
                    includeDeleted: true, // Allow mapping to deleted groups
                    filter: { IsQtyTripMapping: 1 } // Only groups with QtyTripMapping enabled
                },
                filterable: true
            },
            {
                accessor: 'MaterialId',
                label: 'Material Name',
                type: 'select',
                required: true,
                displayField: 'MaterialName', // Show Name from API join
                lookup: {
                    table: 'material',
                    nameField: 'MaterialName',
                    valueField: 'SlNo',
                    includeDeleted: true // Allow mapping to deleted materials
                },
                filterable: true
            },
            { accessor: 'ManagementQtyTrip', label: 'Management Qty/Trip', type: 'number' },
            { accessor: 'NTPCQtyTrip', label: 'NTPC Qty/Trip', type: 'number' },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    relay: {
        table: '[Master].[TblRelay]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Relay Name', required: true, autoFocus: true, unique: true },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    scale: {
        table: '[Master].[TblScale]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Scale Name', required: true, autoFocus: true, unique: true },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    sector: {
        table: '[Master].[TblSector]',
        idField: 'SlNo',
        columns: [
            { accessor: 'SectorName', label: 'Sector Name', required: true, autoFocus: true, unique: true },
            { accessor: 'Remarks', label: 'Remarks', type: 'textarea' },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    shift: {
        table: '[Master].[TblShift]',
        idField: 'SlNo',
        columns: [
            { accessor: 'ShiftName', label: 'Shift Name', required: true, autoFocus: true, unique: true },
            { accessor: 'FromTime', label: 'From Time', type: 'time', required: true },
            { accessor: 'ToTime', label: 'To Time', type: 'time', required: true }
        ]
    },
    'shift-incharge': {
        table: '[Master].[TblShiftIncharge]',
        idField: 'SlNo',
        columns: [
            { accessor: 'ShiftId', label: 'Shift ID', type: 'number', required: true, autoFocus: true },
            { accessor: 'ShiftDate', label: 'Shift Date', type: 'date', required: true },
            { accessor: 'RelayId', label: 'Relay ID', type: 'number', required: true }
        ]
    },
    'sme-supplier': {
        table: '[Master].[TblSMESupplier]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Supplier Name', required: true, autoFocus: true, unique: true },
            {
                accessor: 'SMECategoryId',
                label: 'SME Category',
                type: 'select',
                required: true,
                lookup: { table: 'sme-category', nameField: 'Category', valueField: 'SlNo' },
                filterable: true
            },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    source: {
        table: '[Master].[TblSource]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Source Name', required: true, autoFocus: true, unique: true },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    'stoppage-category': {
        table: '[Master].[TblStoppageCategory]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Category Name', required: true, autoFocus: true, unique: true, row: 1, colSpan: 2 },
            { accessor: 'Remarks', label: 'Remarks', type: 'textarea', row: 2, colSpan: 2 },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', row: 3, defaultValue: true }
        ]
    },
    'stoppage-reason': {
        table: '[Master].[TblStoppageReason]',
        idField: 'SlNo',
        bulkUpload: true,
        columns: [
            { accessor: 'ReasonName', label: 'Reason Name', required: true, autoFocus: true, unique: true, row: 1, colSpan: 2 },
            {
                accessor: 'CategoryId',
                label: 'Category',
                type: 'select',
                required: true,
                lookup: { table: 'stoppage-category', nameField: 'Name', valueField: 'SlNo' },
                row: 2,
                colSpan: 2
            },
            { accessor: 'Remarks', label: 'Remarks', type: 'textarea', row: 3 },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', row: 4, defaultValue: true, excludeFromExport: true }
        ]
    },
    strata: {
        table: '[Master].[TblStrata]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Strata Name', required: true, autoFocus: true, unique: true },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    unit: {
        table: '[Master].[TblUnit]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Unit Name', required: true, autoFocus: true, unique: true },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    'sme-category': {
        table: '[Master].[TblSMECategory]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Category', label: 'Category', required: true, autoFocus: true, unique: true },
            { accessor: 'Remarks', label: 'Remarks', type: 'textarea' }
        ]
    },
    'drilling-remarks': {
        table: '[Master].[TblDrillingRemarks]',
        idField: 'SlNo',
        columns: [
            { accessor: 'DrillingRemarks', label: 'Drilling Remarks', required: true, autoFocus: true, unique: true },
            { accessor: 'Remarks', label: 'Remarks', type: 'textarea' }
        ]
    },
    'bd-reason': {
        table: '[Master].[TblBDReason]',
        idField: 'SlNo',
        columns: [
            { accessor: 'BDReasonName', label: 'Reason Name', required: true, autoFocus: true, unique: true },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    party: {
        table: '[Master].[tblParty]',
        idField: 'SlNo',
        columns: [
            { accessor: 'PartyName', label: 'Party Name', required: true, autoFocus: true, unique: true },
            { accessor: 'Remarks', label: 'Remarks', type: 'textarea' },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    role: {
        table: '[Master].[TblRole_New]',
        idField: 'SlNo',
        columns: [
            { accessor: 'RoleName', label: 'Role Name', type: 'text', required: true, unique: true, autoFocus: true },
            { accessor: 'Remarks', label: 'Remarks', type: 'textarea' },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    },
    user: {
        table: '[Master].[TblUser_New]',
        idField: 'SlNo',
        columns: [
            { accessor: 'EmpName', label: 'Employee Name', type: 'text', required: true },
            { accessor: 'UserName', label: 'User Name', type: 'text', required: true, unique: true },
            { accessor: 'Password', label: 'Password', type: 'password', required: true, hidden: true }, // Hidden in table
            {
                accessor: 'RoleId', label: 'Role', type: 'select', required: true,
                lookup: {
                    table: 'role', // Use config key
                    valueField: 'SlNo',
                    nameField: 'RoleName'
                }
            },
            { accessor: 'ContactNo', label: 'Contact No', type: 'text' },
            { accessor: 'EmailID', label: 'Email ID', type: 'email' },
            { accessor: 'Remarks', label: 'Remarks', type: 'textarea' },
            { accessor: 'IsActive', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    }
};
