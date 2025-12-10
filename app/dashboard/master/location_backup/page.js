'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal/Modal';

const MOCK_DATA = [
    { id: 1, LocCode: 'LOC-01', Name: 'Mine Pit A', Type: 'Pit', Description: 'North Block', Active: 'Yes' },
    { id: 2, LocCode: 'LOC-02', Name: 'Siding 1', Type: 'Siding', Description: 'Railway Load Point', Active: 'Yes' },
    { id: 3, LocCode: 'LOC-03', Name: 'Workshop', Type: 'Workshop', Description: 'Main Repair Shop', Active: 'Yes' },
];

const COLUMNS = [
    { header: 'Location Code', accessor: 'LocCode' },
    { header: 'Location Name', accessor: 'LocationName' },
    { header: 'Type', accessor: 'Type' },
    { header: 'Description', accessor: 'Description' },
    { header: 'Active', accessor: 'Active', type: 'toggle' },
];

export default function LocationMaster() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [formData, setFormData] = useState({ LocCode: '', LocationName: '', Type: 'Pit', Description: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/master/location');
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
        setFormData({ LocCode: '', LocationName: '', Type: 'Pit', Description: '' });
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

            const res = await fetch('/api/master/location', {
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
        if (confirm(`Are you sure you want to delete ${row.LocationName}?`)) {
            try {
                const res = await fetch(`/api/master/location?id=${row.id}`, { method: 'DELETE' });
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

            const res = await fetch('/api/master/location', {
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
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Location Master</h1>
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
                title={currentRecord ? 'Edit Location' : 'Add New Location'}
            >
                <form onSubmit={handleSave} className="form-group" style={{ gap: '1rem' }}>
                    <div className="form-group">
                        <label className="label">
                            Location Code <span className="required-asterisk">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            className="input"
                            value={formData.LocCode}
                            onChange={e => setFormData({ ...formData, LocCode: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">
                            Location Name <span className="required-asterisk">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            className="input"
                            value={formData.LocationName}
                            onChange={e => setFormData({ ...formData, LocationName: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">Type</label>
                        <select
                            className="input"
                            value={formData.Type}
                            onChange={e => setFormData({ ...formData, Type: e.target.value })}
                        >
                            <option>Pit</option>
                            <option>Dump</option>
                            <option>Siding</option>
                            <option>Stockpile</option>
                            <option>Workshop</option>
                            <option>Office</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="label">Description</label>
                        <textarea
                            className="input"
                            rows={3}
                            value={formData.Description}
                            onChange={e => setFormData({ ...formData, Description: e.target.value })}
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
