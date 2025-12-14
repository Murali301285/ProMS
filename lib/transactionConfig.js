export const TRANSACTION_CONFIG = {
    'loading-from-mines': {
        apiEndpoint: '/api/transaction/loading-from-mines',
        table: '[Trans].[TblLoading]',
        idField: 'SlNo',
        defaultSort: 'LoadingDate',
        columns: [
            { accessor: 'SlNo', label: 'SlNo', width: 80, frozen: true },
            { accessor: 'LoadingDate', label: 'Date', type: 'date', width: 120, frozen: true },
            { accessor: 'ShiftName', label: 'Shift', width: 100, frozen: true },
            { accessor: 'ShiftInCharge', label: 'Shift In Charge', width: 200, frozen: true },
            { accessor: 'ManPowerInShift', label: 'Man Power', type: 'number', width: 100 },
            { accessor: 'RelayName', label: 'Relay', width: 150 },
            { accessor: 'SourceName', label: 'Source', width: 150 },
            { accessor: 'DestinationName', label: 'Destination', width: 150 },
            { accessor: 'MaterialName', label: 'Material', width: 150 },
            { accessor: 'HaulerName', label: 'Hauler', width: 150 },
            { accessor: 'LoadingMachineName', label: 'Loading Machine', width: 150 },
            { accessor: 'NoofTrip', label: 'No of Trip', type: 'number', width: 100 },
            { accessor: 'QtyTrip', label: 'Mgmt Qty/Trip', type: 'number', width: 120 },
            { accessor: 'NtpcQtyTrip', label: 'NTPC Qty/Trip', type: 'number', width: 120 },
            { accessor: 'TotalQty', label: 'Mgmt Total Qty', type: 'number', width: 150 },
            { accessor: 'TotalNtpcQty', label: 'NTPC Total Qty', type: 'number', width: 150 },
            { accessor: 'UnitName', label: 'Unit', width: 100 },
            { accessor: 'CreatedByName', label: 'Created By', width: 150 },
            { accessor: 'CreatedDate', label: 'Created Date', type: 'datetime', width: 180, disableFilter: true },
            { accessor: 'UpdatedDate', label: 'Updated Date', type: 'datetime', width: 180, disableFilter: true },
            { accessor: 'UpdatedByName', label: 'Updated By', width: 150 },
        ]
    }
};
