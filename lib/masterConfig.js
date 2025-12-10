export const MASTER_CONFIG = {
    company: {
        table: '[Master].[TblCompany]',
        idField: 'SlNo',
        columns: [
            { accessor: 'CompanyName', label: 'Company Name', type: 'text', required: true, autoFocus: true },
            { accessor: 'GstNo', label: 'GST No', type: 'text', required: true },
            { accessor: 'Address', label: 'Address', type: 'textarea', required: false },
            { accessor: 'CompanyLogo', label: 'Company Logo', type: 'file', accept: 'image/*', maxSize: 2, required: false }
        ]
    },
    activity: {
        table: '[Master].[TblActivity]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Activity Name', type: 'text', required: true },
            { accessor: 'IsDetail', label: 'Is Detail', type: 'checkbox' }
        ]
    },
    'depth-slab': {
        table: '[Master].[TblDepthSlab]',
        idField: 'SlNo',
        columns: [{ accessor: 'Name', label: 'Depth Slab Name', required: true }]
    },
    destination: {
        table: '[Master].[TblDestination]',
        idField: 'SlNo',
        columns: [{ accessor: 'Name', label: 'Destination Name', required: true }]
    },
    'destination-material-mapping': {
        table: '[Master].[TblDestinationMaterialMapping]',
        idField: 'SlNo',
        columns: [
            { accessor: 'DestinationId', label: 'Destination ID', type: 'number', required: true },
            { accessor: 'MaterialId', label: 'Material ID', type: 'number', required: true }
        ]
    },
    'entry-type': {
        table: '[Master].[TblEntryType]',
        idField: 'SlNo',
        columns: [{ accessor: 'Name', label: 'Entry Type Name', required: true }]
    },
    'equipment-group': {
        table: '[Master].[TblEquipmentGroup]',
        idField: 'SlNo',
        columns: [{ accessor: 'Name', label: 'Group Name', required: true }]
    },
    equipment: {
        table: '[Master].[TblEquipment]',
        idField: 'SlNo',
        columns: [
            { accessor: 'EquipmentName', label: 'Equipment Name', required: true },
            { accessor: 'Model', label: 'Model', required: true },
            { accessor: 'EuipmentID', label: 'Equipment ID', required: true },
            { accessor: 'CostCenter', label: 'Cost Center' },
            { accessor: 'EquipmentGroupId', label: 'Group ID', type: 'number', required: true },
            { accessor: 'ActivityId', label: 'Activity ID', type: 'number' },
            { accessor: 'ScaleId', label: 'Scale ID', type: 'number' },
            { accessor: 'TripQty', label: 'Trip Qty', type: 'number' },
            { accessor: 'Active', label: 'Active', type: 'checkbox' }
        ]
    },
    location: {
        table: '[Master].[TblLocation]',
        idField: 'SlNo',
        columns: [
            { accessor: 'LocationName', label: 'Location Name', required: true },
            { accessor: 'Remarks', label: 'Remarks', type: 'textarea' }
        ]
    },
    material: {
        table: '[Master].[TblMaterial]',
        idField: 'SlNo',
        columns: [
            { accessor: 'MaterialName', label: 'Material Name', required: true },
            { accessor: 'CostCenter', label: 'Cost Center' },
            { accessor: 'UnitId', label: 'Unit ID', type: 'number' },
            { accessor: 'Remarks', label: 'Remarks', type: 'textarea' },
            { accessor: 'DrillingOutput', label: 'Drilling Output', type: 'number' },
            { accessor: 'Order', label: 'Order', type: 'number' }
        ]
    },
    method: {
        table: '[Master].[TblMethod]',
        idField: 'SlNo',
        columns: [{ accessor: 'Name', label: 'Method Name', required: true }]
    },
    operator: {
        table: '[Master].[TblOperator]',
        idField: 'SlNo',
        columns: [
            { accessor: 'OperatorId', label: 'Operator ID', required: true },
            { accessor: 'OperatorName', label: 'Operator Name', required: true },
            { accessor: 'MobileNo', label: 'Mobile No' },
            { accessor: 'Remarks', label: 'Remarks', type: 'textarea' },
            { accessor: 'CategoryId', label: 'Category ID', type: 'number' },
            { accessor: 'SubCategoryId', label: 'Sub Category ID', type: 'number' }
        ]
    },
    patch: {
        table: '[Master].[TblPatch]',
        idField: 'SlNo',
        columns: [{ accessor: 'Name', label: 'Patch Name', required: true }]
    },
    plant: {
        table: '[Master].[TblPlant]',
        idField: 'SlNo',
        columns: [
            { accessor: 'Name', label: 'Plant Name', required: true },
            { accessor: 'IsDetails', label: 'Is Details', type: 'checkbox' },
            { accessor: 'IsHaulerFieldShow', label: 'Show Hauler Field', type: 'checkbox' },
            { accessor: 'IsDPRReport', label: 'Is DPR Report', type: 'checkbox' }
        ]
    },
    'qty-trip-mapping': {
        table: '[Master].[TblQtyTripMapping]',
        idField: 'SlNo',
        columns: [
            { accessor: 'EquipmentGroupId', label: 'Equipment Group ID', type: 'number', required: true },
            { accessor: 'MaterialId', label: 'Material ID', type: 'number', required: true },
            { accessor: 'ManagementQtyTrip', label: 'Management Qty/Trip', type: 'number' },
            { accessor: 'NTPCQtyTrip', label: 'NTPC Qty/Trip', type: 'number' }
        ]
    },
    relay: {
        table: '[Master].[TblRelay]',
        idField: 'SlNo',
        columns: [{ accessor: 'Name', label: 'Relay Name', required: true }]
    },
    scale: {
        table: '[Master].[TblScale]',
        idField: 'SlNo',
        columns: [{ accessor: 'Name', label: 'Scale Name', required: true }]
    },
    sector: {
        table: '[Master].[TblSector]',
        idField: 'SlNo',
        columns: [
            { accessor: 'SectorName', label: 'Sector Name', required: true },
            { accessor: 'Remarks', label: 'Remarks', type: 'textarea' }
        ]
    },
    shift: {
        table: '[Master].[TblShift]',
        idField: 'SlNo',
        columns: [
            { accessor: 'ShiftName', label: 'Shift Name', required: true },
            { accessor: 'FromTime', label: 'From Time', type: 'time', required: true },
            { accessor: 'ToTime', label: 'To Time', type: 'time', required: true }
        ]
    },
    'shift-incharge': {
        table: '[Master].[TblShiftIncharge]',
        idField: 'SlNo',
        columns: [
            { accessor: 'ShiftId', label: 'Shift ID', type: 'number', required: true },
            { accessor: 'ShiftDate', label: 'Shift Date', type: 'date', required: true },
            { accessor: 'RelayId', label: 'Relay ID', type: 'number', required: true }
        ]
    },
    'sme-supplier': {
        table: '[Master].[TblSMESupplier]',
        idField: 'SlNo',
        columns: [{ accessor: 'Name', label: 'Supplier Name', required: true }]
    },
    source: {
        table: '[Master].[TblSource]',
        idField: 'SlNo',
        columns: [{ accessor: 'Name', label: 'Source Name', required: true }]
    },
    'stoppage-reason': {
        table: '[Master].[TblStoppageReason]',
        idField: 'SlNo',
        columns: [
            { accessor: 'ReasonName', label: 'Reason Name', required: true },
            { accessor: 'Category', label: 'Category', required: true },
            { accessor: 'Remarks', label: 'Remarks', type: 'textarea' },
            { accessor: 'Active', label: 'Active', type: 'checkbox' }
        ]
    },
    strata: {
        table: '[Master].[TblStrata]',
        idField: 'SlNo',
        columns: [{ accessor: 'Name', label: 'Strata Name', required: true }]
    },
    unit: {
        table: '[Master].[TblUnit]',
        idField: 'SlNo',
        columns: [{ accessor: 'Name', label: 'Unit Name', required: true }]
    }
};
