
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SearchableSelect from '@/components/SearchableSelect';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, RefreshCw, Trash2, Edit } from 'lucide-react'; // Added RefreshCw
import TransactionTable from '@/components/TransactionTable'; // Added
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig'; // Added
import styles from './WaterTankerForm.module.css';

export default function WaterTankerForm({ initialHelpers = {}, initialData = null, userRole = 'User' }) {
    const router = useRouter();
    const [helpers, setHelpers] = useState(initialHelpers);
    const [submitting, setSubmitting] = useState(false);

    // Initial State
    const initialState = initialData ? {
        ...initialData,
        EntryDate: initialData.EntryDate ? initialData.EntryDate.split('T')[0] : new Date().toISOString().slice(0, 10),
        Remarks: initialData.Remarks || ''
    } : {
        EntryDate: new Date().toISOString().slice(0, 10),
        ShiftId: '',
        DestinationId: '',
        HaulerId: '',
        FillingPointId: '',
        FillingPumpId: '',
        NoOfTrip: '',
        Capacity: '',
        TotalQty: '',
        Remarks: ''
    };

    const [formData, setFormData] = useState(initialState);
    const [errors, setErrors] = useState({});

    // Table Data State
    const [tableData, setTableData] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);

    // Refs for Focus management
    const shiftRef = useRef(null);
    const destRef = useRef(null);
    const haulerRef = useRef(null);
    const fillPtRef = useRef(null);
    const fillPumpRef = useRef(null);
    const tripsRef = useRef(null);
    const remarksRef = useRef(null);

    // Auto Focus Shift on Load
    useEffect(() => {
        if (shiftRef.current) setTimeout(() => shiftRef.current.focus(), 100);
    }, []);

    // Last Entry Context Logic - REMOVED AS PER REQUEST
    // useEffect(() => { ... }, []);

    // Fetch Table Data
    const fetchTableData = async () => {
        if (!formData.EntryDate) return;
        setTableLoading(true);
        try {
            const config = TRANSACTION_CONFIG['water-tanker-entry'];
            const params = new URLSearchParams({
                fromDate: formData.EntryDate,
                toDate: formData.EntryDate
            });
            const res = await fetch(`${config.apiEndpoint}?${params}`);
            const result = await res.json();
            if (result.success && result.data) {
                setTableData(result.data);
            } else if (Array.isArray(result)) {
                setTableData(result);
            }
        } catch (err) {
            console.error("Failed to load table data", err);
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => {
        fetchTableData();
    }, [formData.EntryDate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const upd = { ...prev, [name]: value };

            if (name === 'NoOfTrip') {
                const trips = parseFloat(value) || 0;
                const cap = parseFloat(prev.Capacity) || 0;
                upd.TotalQty = (trips * cap).toFixed(3);
            }

            if (name === 'HaulerId') {
                const hauler = helpers.haulers.find(h => h.SlNo == value);
                if (hauler) {
                    const cap = parseFloat(hauler.Capacity) || 0;
                    upd.Capacity = cap;
                    const trips = parseFloat(prev.NoOfTrip) || 0;
                    upd.TotalQty = (trips * cap).toFixed(3);
                    if (cap === 0) toast.warning('Selected Hauler has 0 Capacity');
                } else {
                    upd.Capacity = '';
                    upd.TotalQty = '';
                }
            }
            return upd;
        });

        if (errors[name] && value) {
            setErrors(prev => ({ ...prev, [name]: false }));
        }

        if (['ShiftId', 'DestinationId', 'HaulerId', 'FillingPointId', 'FillingPumpId'].includes(name)) {
            setTimeout(() => {
                if (name === 'ShiftId') destRef.current?.focus();
                if (name === 'DestinationId') haulerRef.current?.focus();
                if (name === 'HaulerId') fillPtRef.current?.focus();
                if (name === 'FillingPointId') fillPumpRef.current?.focus();
                if (name === 'FillingPumpId') tripsRef.current?.focus();
            }, 100);
        }
    };

    const handleSave = async () => {
        const newErrors = {};
        ['EntryDate', 'ShiftId', 'DestinationId', 'HaulerId', 'FillingPointId', 'FillingPumpId', 'NoOfTrip', 'Capacity', 'TotalQty'].forEach(f => {
            if (!formData[f]) newErrors[f] = true;
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Missing required fields');
            return;
        }

        setSubmitting(true);
        try {
            const isEdit = !!initialData?.SlNo;
            const url = isEdit
                ? `/api/transaction/water-tanker-entry/${initialData.SlNo}`
                : '/api/transaction/water-tanker-entry';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                toast.success('Saved successfully');
                if (isEdit) {
                    router.push('/dashboard/transaction/water-tanker-entry');
                } else {
                    // Reset fields but keep Date & Shift
                    setFormData(prev => ({
                        ...prev,
                        DestinationId: '',
                        HaulerId: '',
                        FillingPointId: '',
                        FillingPumpId: '',
                        NoOfTrip: '',
                        Capacity: '',
                        TotalQty: '',
                        Remarks: ''
                    }));
                    // Auto-focus Destination
                    setTimeout(() => destRef.current?.focus(), 100);
                    fetchTableData(); // Refresh table
                }
            } else {
                toast.error(data.message || 'Save failed');
            }
        } catch (err) {
            toast.error('Network Error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            const res = await fetch(`/api/transaction/water-tanker-entry/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success("Deleted successfully");
                fetchTableData();
            } else {
                toast.error("Failed to delete");
            }
        } catch (e) {
            toast.error("Network error");
        }
    };

    const handleEdit = (row) => {
        router.push(`/dashboard/transaction/water-tanker-entry/${row.SlNo}`);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F2' || (e.ctrlKey && e.key === 's')) {
                e.preventDefault();
                handleSave();
            }
            if (e.key === 'F5') {
                e.preventDefault();
                window.location.reload();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [formData]);

    const shiftOpts = helpers.shifts?.map(s => ({ id: s.SlNo, name: s.ShiftName })) || [];
    const destOpts = helpers.fillingPoints?.map(f => ({ id: f.SlNo, name: f.FillingPoint })) || [];
    const haulerOpts = helpers.haulers?.map(h => ({ id: h.SlNo, name: h.EquipmentName })) || [];
    const pumpOpts = helpers.fillingPumps?.map(p => ({ id: p.SlNo, name: p.FillingPump })) || [];

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => router.push('/dashboard/transaction/water-tanker-entry')}>
                    <ArrowLeft size={16} /> Back
                </button>

                <h1 className={styles.title}>{initialData ? 'Update' : 'Create'} Water Tanker Entry</h1>

                <div className={styles.headerActions}>
                    <button className={styles.refreshBtn} onClick={() => window.location.reload()}>
                        <RefreshCw size={18} />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={submitting}
                        className={styles.saveBtn}
                    >
                        {submitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {initialData ? 'Update (F2)' : 'Save (F2)'}
                    </button>
                </div>
            </div>

            <div className={styles.card}>
                {/* ROW 1: Date & Shift */}
                <div className={styles.row1}>
                    <div className={styles.group}>
                        <label>Date <span className={styles.required}>*</span> {errors.EntryDate && <span className={styles.errorMsg}>Required</span>}</label>
                        <input
                            type="date"
                            name="EntryDate"
                            value={formData.EntryDate}
                            onChange={handleChange}
                            className={`${styles.input} ${errors.EntryDate ? styles.errorBorder : ''}`}
                        />
                    </div>
                    <div className={styles.group}>
                        <label>Shift <span className={styles.required}>*</span> {errors.ShiftId && <span className={styles.errorMsg}>Required</span>}</label>
                        <SearchableSelect
                            ref={shiftRef}
                            name="ShiftId"
                            options={shiftOpts}
                            value={formData.ShiftId}
                            onChange={handleChange}
                            error={errors.ShiftId}
                            className={styles.select}
                        />
                    </div>
                </div>

                {/* ROW 2: Destination, Hauler, Filling Point, Filling Pump */}
                <div className={styles.row2}>
                    <div className={styles.group}>
                        <label>Destination (Filling Pt) <span className={styles.required}>*</span> {errors.DestinationId && <span className={styles.errorMsg}>Required</span>}</label>
                        <SearchableSelect
                            ref={destRef}
                            name="DestinationId"
                            options={destOpts}
                            value={formData.DestinationId}
                            onChange={handleChange}
                            error={errors.DestinationId}
                            className={styles.select}
                        />
                    </div>
                    <div className={styles.group}>
                        <label>Hauler <span className={styles.required}>*</span> {errors.HaulerId && <span className={styles.errorMsg}>Required</span>}</label>
                        <SearchableSelect
                            ref={haulerRef}
                            name="HaulerId"
                            options={haulerOpts}
                            value={formData.HaulerId}
                            onChange={handleChange}
                            error={errors.HaulerId}
                            className={styles.select}
                        />
                    </div>
                    <div className={styles.group}>
                        <label>Filling Point <span className={styles.required}>*</span> {errors.FillingPointId && <span className={styles.errorMsg}>Required</span>}</label>
                        <SearchableSelect
                            ref={fillPtRef}
                            name="FillingPointId"
                            options={destOpts} // Reuse Filling Point opts as per previous logic (or if separate list needed, use correct opts)
                            value={formData.FillingPointId}
                            onChange={handleChange}
                            error={errors.FillingPointId}
                            className={styles.select}
                        />
                    </div>
                    <div className={styles.group}>
                        <label>Filling Pump <span className={styles.required}>*</span> {errors.FillingPumpId && <span className={styles.errorMsg}>Required</span>}</label>
                        <SearchableSelect
                            ref={fillPumpRef}
                            name="FillingPumpId"
                            options={pumpOpts}
                            value={formData.FillingPumpId}
                            onChange={handleChange}
                            error={errors.FillingPumpId}
                            className={styles.select}
                        />
                    </div>
                </div>

                {/* ROW 3: Trips -> Totals */}
                <div className={styles.row3}>
                    <div className={styles.group}>
                        <label>No Of Trip <span className={styles.required}>*</span> {errors.NoOfTrip && <span className={styles.errorMsg}>Required</span>}</label>
                        <input
                            ref={tripsRef}
                            type="number"
                            name="NoOfTrip"
                            value={formData.NoOfTrip}
                            onChange={handleChange}
                            className={`${styles.input} ${errors.NoOfTrip ? styles.errorBorder : ''}`}
                            onKeyDown={(e) => { if (e.key === 'Enter') remarksRef.current?.focus(); }}
                        />
                    </div>
                    <div className={styles.group}>
                        <label>Capacity <span className={styles.required}>*</span> {errors.Capacity && <span className={styles.errorMsg}>Required</span>}</label>
                        <input
                            type="number"
                            value={formData.Capacity}
                            readOnly
                            className={`${styles.input} ${styles.readOnly} ${errors.Capacity ? styles.errorBorder : ''}`}
                        />
                    </div>
                    <div className={styles.group}>
                        <label>Total Qty <span className={styles.required}>*</span> {errors.TotalQty && <span className={styles.errorMsg}>Required</span>}</label>
                        <input
                            type="number"
                            value={formData.TotalQty}
                            readOnly
                            className={`${styles.input} ${styles.readOnly} ${errors.TotalQty ? styles.errorBorder : ''}`}
                        />
                    </div>
                </div>

                {/* ROW 5: Remarks */}
                <div className={styles.group}>
                    <label>Remarks</label>
                    <input
                        ref={remarksRef}
                        type="text"
                        name="Remarks"
                        value={formData.Remarks}
                        onChange={handleChange}
                        className={styles.input}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                    />
                </div>
            </div>

            <div className={styles.dataTableSection}>
                <h3 className={styles.tableTitle}>Recent Entries</h3>
                <TransactionTable
                    config={TRANSACTION_CONFIG['water-tanker-entry']}
                    data={tableData}
                    isLoading={tableLoading}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    userRole={userRole}
                    hideHeader={false}
                />
            </div>
        </div>
    );
}
