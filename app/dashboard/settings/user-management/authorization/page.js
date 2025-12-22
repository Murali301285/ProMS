'use client';

import { useState, useEffect, Fragment } from 'react';
import styles from '@/app/dashboard/settings/Settings.module.css';
import { Save, CheckSquare, Square, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function RoleAuthorizationPage() {
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Roles on Mount
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await fetch('/api/settings/crud', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'read', table: 'TblRole_New' })
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setRoles(data.filter(r => r.IsActive));
                }
            } catch (error) {
                console.error("Failed to fetch roles", error);
            }
        };
        fetchRoles();
    }, []);

    // Fetch Permissions when Role Changes
    useEffect(() => {
        if (!selectedRole) {
            setPermissions([]);
            return;
        }

        const fetchPermissions = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/settings/role-authorization/list', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roleId: selectedRole })
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setPermissions(data);
                    setExpandedRows({}); // Default minimized
                }
            } catch (error) {
                toast.error("Failed to fetch permissions");
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, [selectedRole]);

    const handleCheckboxChange = (permId, pageId, field, checked) => {
        setPermissions(prev => {
            const next = [...prev];
            const targetIndex = next.findIndex(p => p.PageId === pageId);
            if (targetIndex === -1) return next;

            // 1. Update the target itself
            next[targetIndex] = { ...next[targetIndex], [field]: checked };

            // 2. View Dependency Logic
            if (field === 'IsView' && !checked) {
                next[targetIndex].IsAdd = false;
                next[targetIndex].IsEdit = false;
                next[targetIndex].IsDelete = false;
            }

            return next;
        });
    };

    const handleModuleSelectAll = (moduleId, field, checked) => {
        setPermissions(prev => prev.map(p => {
            if (p.ModuleId === moduleId) {
                const updated = { ...p, [field]: checked };
                if (field === 'IsView' && !checked) {
                    updated.IsAdd = false;
                    updated.IsEdit = false;
                    updated.IsDelete = false;
                }
                return updated;
            }
            return p;
        }));
    };

    const handleSelectAllColumn = (field, checked) => {
        setPermissions(prev => prev.map(p => {
            const updated = { ...p, [field]: checked };
            if (field === 'IsView' && !checked) {
                updated.IsAdd = false;
                updated.IsEdit = false;
                updated.IsDelete = false;
            }
            return updated;
        }));
    };

    const toggleRow = (moduleId) => {
        setExpandedRows(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    const handleSave = async () => {
        if (!selectedRole) return;
        setSaving(true);
        try {
            const res = await fetch('/api/settings/role-authorization/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roleId: selectedRole,
                    permissions: permissions
                })
            });
            const result = await res.json();
            if (res.ok) {
                toast.success("Permissions updated successfully");
                window.dispatchEvent(new Event('menu-updated')); // Auto-refresh sidebar
                const refreshRes = await fetch('/api/settings/role-authorization/list', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roleId: selectedRole })
                });
                const refreshData = await refreshRes.json();
                setPermissions(refreshData);
                setExpandedRows({}); // Default minimized
            } else {
                toast.error(result.message || "Save failed");
            }
        } catch (error) {
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    // Grouping Logic
    const groupedPermissions = () => {
        const groups = {};
        permissions.forEach(p => {
            if (!groups[p.ModuleName]) {
                groups[p.ModuleName] = {
                    moduleId: p.ModuleId,
                    moduleName: p.ModuleName,
                    items: []
                };
            }
            groups[p.ModuleName].items.push(p);
        });
        return Object.values(groups);
    };

    const renderRows = () => {
        const groups = groupedPermissions();

        // Filter by Search
        const filteredGroups = groups.map(g => {
            const itemsMatch = g.items.filter(i => i.PageName.toLowerCase().includes(searchTerm.toLowerCase()));
            const groupMatch = g.moduleName.toLowerCase().includes(searchTerm.toLowerCase());
            if (searchTerm && (itemsMatch.length > 0 || groupMatch)) {
                return { ...g, items: searchTerm ? (groupMatch ? g.items : itemsMatch) : g.items };
            }
            return searchTerm ? null : g;
        }).filter(Boolean);


        return filteredGroups.map(group => {
            const isExpanded = searchTerm ? true : expandedRows[group.moduleId];

            return (
                <Fragment key={group.moduleId}>
                    {/* Module Header Row */}
                    <tr key={`mod-${group.moduleId}`} style={{ backgroundColor: '#f0fdf4', fontWeight: 'bold', borderBottom: '2px solid #e5e7eb' }}>
                        <td style={{ paddingLeft: '1rem', display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '12px', paddingBottom: '12px' }}>
                            <button onClick={() => !searchTerm && toggleRow(group.moduleId)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex' }}>
                                {isExpanded ? <ChevronDown size={18} strokeWidth={3} /> : <ChevronRight size={18} strokeWidth={3} />}
                            </button>
                            <span
                                onClick={() => !searchTerm && toggleRow(group.moduleId)}
                                style={{ cursor: 'pointer', fontSize: '1.05rem', color: '#14532d' }}
                            >
                                {group.moduleName}
                            </span>
                        </td>
                        <td className="text-center"><div className="flex justify-center"><ActionCheckbox onChange={(c) => handleModuleSelectAll(group.moduleId, 'IsView', c)} /></div></td>
                        {(group.moduleName.toLowerCase().includes('report') || group.moduleName.toLowerCase().includes('dashboard')) ? (
                            <>
                                <td className="text-center"></td>
                                <td className="text-center"></td>
                                <td className="text-center"></td>
                            </>
                        ) : (
                            <>
                                <td className="text-center"><div className="flex justify-center"><ActionCheckbox onChange={(c) => handleModuleSelectAll(group.moduleId, 'IsAdd', c)} /></div></td>
                                <td className="text-center"><div className="flex justify-center"><ActionCheckbox onChange={(c) => handleModuleSelectAll(group.moduleId, 'IsEdit', c)} /></div></td>
                                <td className="text-center"><div className="flex justify-center"><ActionCheckbox onChange={(c) => handleModuleSelectAll(group.moduleId, 'IsDelete', c)} /></div></td>
                            </>
                        )}
                    </tr>

                    {/* Page Rows */}
                    {isExpanded && group.items.map(page => {
                        const isRestrictedModule = group.moduleName.toLowerCase().includes('report') || group.moduleName.toLowerCase().includes('dashboard');
                        return (
                            <tr key={page.PageId} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ paddingLeft: '3.5rem', color: '#555', paddingTop: '8px', paddingBottom: '8px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span>{page.PageName}</span>
                                        {page.SubGroupName && <span style={{ fontSize: '0.75em', color: '#999' }}>{page.SubGroupName}</span>}
                                    </div>
                                </td>
                                <td className="text-center"><div className="flex justify-center"><Checkbox p={page} field="IsView" onChange={handleCheckboxChange} /></div></td>
                                {isRestrictedModule ? (
                                    <>
                                        <td className="text-center"></td>
                                        <td className="text-center"></td>
                                        <td className="text-center"></td>
                                    </>
                                ) : (
                                    <>
                                        <td className="text-center"><div className="flex justify-center"><Checkbox p={page} field="IsAdd" onChange={handleCheckboxChange} /></div></td>
                                        <td className="text-center"><div className="flex justify-center"><Checkbox p={page} field="IsEdit" onChange={handleCheckboxChange} /></div></td>
                                        <td className="text-center"><div className="flex justify-center"><Checkbox p={page} field="IsDelete" onChange={handleCheckboxChange} /></div></td>
                                    </>
                                )}
                            </tr>
                        );
                    })}
                </Fragment>
            );
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Role Authorization</h1>
                {selectedRole && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={styles.btnPrimary}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                )}
            </div>

            <div className={`${styles.card} glass`} style={{ marginBottom: '20px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                    <label className={styles.label}>Select Role</label>
                    <select
                        className={styles.select}
                        value={selectedRole}
                        onChange={e => setSelectedRole(e.target.value)}
                        style={{ width: '100%' }}
                    >
                        <option value="">-- Choose a Role --</option>
                        {roles.map(r => (
                            <option key={r.SlNo} value={r.SlNo}>{r.RoleName}</option>
                        ))}
                    </select>
                </div>

                {selectedRole && (
                    <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                        <label className={styles.label}>Search Logic Menus</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Search menu name..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ paddingRight: '30px' }}
                            />
                            <Search size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        </div>
                    </div>
                )}
            </div>

            {selectedRole && (
                <div className={`${styles.tableContainer} glass`}>
                    <table className={styles.table} style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Menu Name</th>
                                <th className="text-center" style={{ width: '15%' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                        <span>View</span>
                                        <HeaderCheckbox field="IsView" permissions={permissions} onChange={handleSelectAllColumn} />
                                    </div>
                                </th>
                                <th className="text-center" style={{ width: '15%' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                        <span>Add</span>
                                        <HeaderCheckbox field="IsAdd" permissions={permissions} onChange={handleSelectAllColumn} />
                                    </div>
                                </th>
                                <th className="text-center" style={{ width: '15%' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                        <span>Edit</span>
                                        <HeaderCheckbox field="IsEdit" permissions={permissions} onChange={handleSelectAllColumn} />
                                    </div>
                                </th>
                                <th className="text-center" style={{ width: '15%' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                        <span>Delete</span>
                                        <HeaderCheckbox field="IsDelete" permissions={permissions} onChange={handleSelectAllColumn} />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="text-center p-4">Loading permissions...</td></tr>
                            ) : permissions.length > 0 ? (
                                renderRows()
                            ) : (
                                <tr><td colSpan="5" className="text-center p-4">No menus found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// Simple Checkbox Component
function Checkbox({ p, field, onChange, size = 20, color = "#10b981" }) {
    const checked = !!p[field];
    return (
        <label style={{ cursor: 'pointer', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(p.Permissionid, p.PageId, field, e.target.checked)}
                style={{ display: 'none' }}
            />
            {checked ? <CheckSquare size={size} color={color} fill={color} stroke="white" /> : <Square size={size} color="#cbd5e1" />}
        </label>
    );
}

// Action Checkbox (Select All for Module/Header)
function ActionCheckbox({ onChange, size = 20, color = "#15803d" }) {
    // This could optionally accept 'checked' state if we computed 'all selected' status
    // For now, simpler to just trigger action
    return (
        <label style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Select All in Group">
            <input
                type="checkbox"
                onChange={(e) => onChange(e.target.checked)}
                style={{ display: 'none' }}
            />
            <Square size={size} color="#94a3b8" fill="white" strokeDasharray="4 2" />
        </label>
    );
}

// Header Checkbox for Select All
function HeaderCheckbox({ field, permissions, onChange }) {
    const allChecked = permissions.length > 0 && permissions.every(p => p[field]);

    return (
        <label style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title="Select All / Deselect All">
            <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => onChange(field, e.target.checked)}
                style={{ display: 'none' }}
            />
            {allChecked ? <CheckSquare size={18} color="#10b981" /> : <Square size={18} color="#94a3b8" />}
        </label>
    );
}
