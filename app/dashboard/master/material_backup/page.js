'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal/Modal';

const MOCK_DATA = [
    { id: 1, MatCode: 'M-001', Name: 'Coal', Unit: 'MT', Type: 'Mineral', Active: 'Yes' },
    { id: 2, MatCode: 'M-002', Name: 'Overburden', Unit: 'CuM', Type: 'Waste', Active: 'Yes' },
    { id: 3, MatCode: 'M-003', Name: 'Diesel', Unit: 'Ltr', Type: 'Fuel', Active: 'Yes' },
];

const COLUMNS = [
    { header: 'Material Code', accessor: 'MatCode' },
    { header: 'Material Name', accessor: 'MaterialName' },
    { header: 'Type', accessor: 'Type' },
    { header: 'Unit', accessor: 'Unit' },
    { header: 'Active', accessor: 'Active', type: 'toggle' },
];

export default function MaterialMaster() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [formData, setFormData] = useState({ MatCode: '', MaterialName: '', Type: 'Mineral', Unit: 'MT' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/master/material');
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
        setFormData({ MatCode: '', MaterialName: '', Type: 'Mineral', Unit: 'MT' });
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

            const res = await fetch('/api/master/material', {
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
        if (confirm(`Are you sure you want to delete ${row.MaterialName}?`)) {
            try {
                const res = await fetch(`/api/master/material?id=${row.id}`, { method: 'DELETE' });
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

            const res = await fetch('/api/master/material', {
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
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Material Master</h1>
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
                title={currentRecord ? 'Edit Material' : 'Add New Material'}
            >
                <form onSubmit={handleSave} className="form-group" style={{ gap: '1rem' }}>
                    <div className="form-group">
                        <label className="label">
                            Material Code <span className="required-asterisk">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            className="input"
                            value={formData.MatCode}
                            onChange={e => setFormData({ ...formData, MatCode: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">
                            Material Name <span className="required-asterisk">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            className="input"
                            value={formData.MaterialName}
                            onChange={e => setFormData({ ...formData, MaterialName: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">Type</label>
                        <select
                            className="input"
                            value={formData.Type}
                            onChange={e => setFormData({ ...formData, Type: e.target.value })}
                        >
                            <option>Mineral</option>
                            <option>Waste</option>
                            <option>Fuel</option>
                            <option>Explosive</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="label">Unit</label>
                        <select
                            className="input"
                            value={formData.Unit}
                            onChange={e => setFormData({ ...formData, Unit: e.target.value })}
                        >
                            <option>MT</option>
                            <option>CuM</option>
                            <option>Ltr</option>
                            <option>Kg</option>
                            <option>Nos</option>
                        </select>
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
