'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal/Modal';

const COLUMNS = [
    { header: 'Eq Code', accessor: 'EqCode' },
    { header: 'Equipment Name', accessor: 'EquipmentName' },
    { header: 'Type', accessor: 'Type' },
    { header: 'Capacity', accessor: 'Capacity' },
    { header: 'Active', accessor: 'Active', type: 'toggle' },
];

export default function EquipmentMaster() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [formData, setFormData] = useState({ EqCode: '', EquipmentName: '', Type: 'Excavator', Capacity: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/master/equipment');
            if (res.ok) {
                const json = await res.json();
                const formatted = json.map(item => ({
                    ...item,
                    Active: item.Active ? 'Yes' : 'No'
                }));
                setData(formatted);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openAddModal = () => {
        setCurrentRecord(null);
        setFormData({ EqCode: '', EquipmentName: '', Type: 'Excavator', Capacity: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (row) => {
        setCurrentRecord(row);
        setFormData(row);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const method = currentRecord ? 'PUT' : 'POST';
            const body = currentRecord ? { id: currentRecord.id, ...formData } : formData;

            const res = await fetch('/api/master/equipment', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                fetchData();
                setIsModalOpen(false);
            } else {
                const errorData = await res.json();
                alert(`Operation failed: ${errorData.message}`);
            }
        } catch (error) {
            console.error(error);
            alert(`An error occurred: ${error.message}`);
        }
    };

    const handleDelete = async (row) => {
        if (confirm(`Are you sure you want to delete ${row.EquipmentName}?`)) {
            try {
                const res = await fetch(`/api/master/equipment?id=${row.id}`, { method: 'DELETE' });
                if (res.ok) fetchData();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleToggleActive = async (row, newStatus) => {
        try {
            const statusText = newStatus ? 'Yes' : 'No';
            setData(prev => prev.map(item =>
                item.id === row.id ? { ...item, Active: statusText } : item
            ));

            const res = await fetch('/api/master/equipment', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: row.id, Active: newStatus })
            });

            if (!res.ok) fetchData();
        } catch (error) {
            console.error(error);
            fetchData();
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Equipment Master</h1>
                <button
                    className="btn-primary btn-animate"
                    style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    onClick={openAddModal}
                >
                    <Plus size={20} />
                    Add New
                </button>
            </div>

            <DataTable
                columns={COLUMNS}
                data={data}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentRecord ? 'Edit Equipment' : 'Add New Equipment'}
            >
                <form onSubmit={handleSave} className="form-group" style={{ gap: '1rem' }}>
                    <div className="form-group">
                        <label className="label">
                            Eq Code <span className="required-asterisk">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            className="input"
                            value={formData.EqCode}
                            onChange={e => setFormData({ ...formData, EqCode: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">
                            Equipment Name <span className="required-asterisk">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            className="input"
                            value={formData.EquipmentName}
                            onChange={e => setFormData({ ...formData, EquipmentName: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">Type</label>
                        <select
                            className="input"
                            value={formData.Type}
                            onChange={e => setFormData({ ...formData, Type: e.target.value })}
                        >
                            <option>Excavator</option>
                            <option>Dumper</option>
                            <option>Dozer</option>
                            <option>Grader</option>
                            <option>Loader</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="label">Capacity</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.Capacity}
                            onChange={e => setFormData({ ...formData, Capacity: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Save</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
