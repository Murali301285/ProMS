'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal/Modal';

const COLUMNS = [
    { header: 'Company Name', accessor: 'CompanyName' },
    { header: 'GST No', accessor: 'GstNo' },
    { header: 'Address', accessor: 'Address' },
    { header: 'Active', accessor: 'Active', type: 'toggle' },
];

export default function CompanyMaster() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [formData, setFormData] = useState({ CompanyName: '', GstNo: '', Address: '', CompanyLogo: '' });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB
                alert('File size exceeds 2MB limit');
                e.target.value = ''; // Reset input
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, CompanyLogo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/master/company');
            if (res.ok) {
                const json = await res.json();
                // Ensure Active is converted to 'Yes'/'No' for UI consistency if it comes as boolean
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
        setFormData({ CompanyName: '', GstNo: '', Address: '', CompanyLogo: '' });
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

            const res = await fetch('/api/master/company', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                fetchData(); // Refresh
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
        if (confirm(`Are you sure you want to delete ${row.CompanyName}?`)) {
            try {
                const res = await fetch(`/api/master/company?id=${row.id}`, { method: 'DELETE' });
                if (res.ok) {
                    fetchData();
                }
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleToggleActive = async (row, newStatus) => {
        try {
            // Optimistic update for UI speed
            const statusText = newStatus ? 'Yes' : 'No';
            setData(prev => prev.map(item =>
                item.id === row.id ? { ...item, Active: statusText } : item
            ));

            const res = await fetch('/api/master/company', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: row.id, Active: newStatus })
            });

            if (!res.ok) {
                // Revert if failed
                fetchData();
            }
        } catch (error) {
            console.error(error);
            fetchData();
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Company Master</h1>
                <button
                    className="btn-primary btn-animate"
                    style={{
                        display: 'flex', gap: '0.5rem', alignItems: 'center'
                    }}
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
                title={currentRecord ? 'Edit Company' : 'Add New Company'}
            >
                <form onSubmit={handleSave} className="form-group" style={{ gap: '1rem' }}>
                    <div className="form-group">
                        <label className="label">
                            Company Name <span className="required-asterisk">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            className="input"
                            value={formData.CompanyName}
                            onChange={e => setFormData({ ...formData, CompanyName: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">
                            GST No <span className="required-asterisk">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            className="input"
                            value={formData.GstNo}
                            onChange={e => setFormData({ ...formData, GstNo: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">Address</label>
                        <textarea
                            className="input"
                            rows={3}
                            value={formData.Address}
                            onChange={e => setFormData({ ...formData, Address: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label className="label">Company Logo (Max 2MB)</label>
                        <input
                            type="file"
                            accept="image/*"
                            className="input"
                            onChange={handleFileChange}
                        />
                        {formData.CompanyLogo && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <img
                                    src={formData.CompanyLogo}
                                    alt="Preview"
                                    style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '4px', border: '1px solid var(--border)' }}
                                />
                            </div>
                        )}
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
