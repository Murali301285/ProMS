
'use client';

import { useState, useEffect } from 'react';
import styles from './MenuAllocation.module.css';
import { Plus, Save, Trash2, Edit, X, Check, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function MenuAllocationPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ modules: [], subGroups: [], pages: [], allocations: [] });

    // UI States
    const [newSubGroupName, setNewSubGroupName] = useState('');
    const [selectedModuleForSub, setSelectedModuleForSub] = useState('');

    // Edit States
    const [editingSubGroupId, setEditingSubGroupId] = useState(null);
    const [editSubGroupName, setEditSubGroupName] = useState('');

    const fetchMenuData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings/menu');
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenuData();
    }, []);

    const getAllocation = (pageId) => data.allocations.find(a => a.PageId === pageId);

    const handleCreateSubGroup = async () => {
        if (!newSubGroupName || !selectedModuleForSub) return toast.warning("Please enter name and select module");

        await fetch('/api/settings/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create_subgroup',
                moduleId: selectedModuleForSub,
                name: newSubGroupName
            })
        });

        setNewSubGroupName('');
        fetchMenuData();
    };

    const handleAllocate = async (pageId, moduleId, subGroupId) => {
        if (!moduleId) return;

        await fetch('/api/settings/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'allocate_page',
                pageId,
                moduleId,
                subGroupId
            })
        });
        fetchMenuData();
    };

    const handleRemoveAllocation = async (pageId) => {
        await fetch('/api/settings/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'remove_allocation',
                pageId
            })
        });
        fetchMenuData();
    }

    // SubGroup Management
    const startEditSubGroup = (sg) => {
        setEditingSubGroupId(sg.SlNo);
        setEditSubGroupName(sg.SubGroupName);
    };

    const cancelEditSubGroup = () => {
        setEditingSubGroupId(null);
        setEditSubGroupName('');
    };

    const saveSubGroup = async (id) => {
        await fetch('/api/settings/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_subgroup', id, name: editSubGroupName })
        });
        setEditingSubGroupId(null);
        fetchMenuData();
    };

    const toggleSubGroupActive = async (sg) => {
        await fetch('/api/settings/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_subgroup', id: sg.SlNo, isActive: !sg.IsActive })
        });
        fetchMenuData();
    };

    const deleteSubGroup = async (id) => {
        if (!confirm("Delete this SubGroup?")) return;

        const res = await fetch('/api/settings/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_subgroup', id })
        });
        const json = await res.json();
        if (!res.ok) {
            toast.error(json.message || "Error deleting");
        } else {
            toast.success("SubGroup deleted");
            fetchMenuData();
        }
    };

    if (loading && !data.modules.length) return <div className="p-8">Loading...</div>;

    const unallocatedPages = data.pages.filter(p => !getAllocation(p.SlNo));

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Menu Allocation</h1>

            <div className={styles.grid}>
                {/* LEFT: Unallocated Pages */}
                <div className={`${styles.card} glass`}>
                    <h2 className={styles.cardTitle}>Available Sub Menus</h2>
                    <p className={styles.subtitle}>Sub Menus not yet assigned to any menu</p>

                    <div className={styles.list}>
                        {unallocatedPages.map(page => (
                            <div key={page.SlNo} className={styles.draggableItem}>
                                <span>{page.PageName}</span>
                                <div className={styles.actions}>
                                    <select
                                        className={styles.miniSelect}
                                        onChange={(e) => handleAllocate(page.SlNo, e.target.value, null)}
                                        value=""
                                    >
                                        <option value="">Move to Module...</option>
                                        {data.modules.map(m => (
                                            <option key={m.SlNo} value={m.SlNo}>{m.ModuleName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                        {unallocatedPages.length === 0 && <div className={styles.empty}>No unallocated Sub Menus</div>}
                    </div>
                </div>

                {/* RIGHT: Menu Tree Structure */}
                <div className={`${styles.card} glass`}>
                    <div className={styles.headerRow}>
                        <h2 className={styles.cardTitle}>Menu Structure</h2>
                        <div className={styles.inlineForm}>
                            <select
                                value={selectedModuleForSub}
                                onChange={(e) => setSelectedModuleForSub(e.target.value)}
                                className={styles.select}
                            >
                                <option value="">Select Module</option>
                                {data.modules.map(m => <option key={m.SlNo} value={m.SlNo}>{m.ModuleName}</option>)}
                            </select>
                            <input
                                type="text"
                                placeholder="New SubGroup Name"
                                value={newSubGroupName}
                                onChange={(e) => setNewSubGroupName(e.target.value)}
                                className={styles.input}
                            />
                            <button onClick={handleCreateSubGroup} className={styles.iconBtn} title="Add SubGroup">
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.tree}>
                        {data.modules.map(mod => {
                            const modSubGroups = data.subGroups.filter(sg => sg.ModuleId === mod.SlNo);
                            const modPages = data.allocations
                                .filter(a => a.ModuleId === mod.SlNo && !a.SubGroupId)
                                .map(a => data.pages.find(p => p.SlNo === a.PageId));

                            return (
                                <div key={mod.SlNo} className={styles.moduleBlock}>
                                    <div className={styles.moduleHeader}>
                                        <strong>{mod.ModuleName}</strong>
                                    </div>

                                    {/* SubGroups */}
                                    {modSubGroups.map(sg => {
                                        const sgPages = data.allocations
                                            .filter(a => a.SubGroupId === sg.SlNo)
                                            .map(a => data.pages.find(p => p.SlNo === a.PageId));

                                        const isEditing = editingSubGroupId === sg.SlNo;

                                        return (
                                            <div key={sg.SlNo} className={`${styles.subGroupBlock} ${!sg.IsActive ? 'opacity-60' : ''}`}>
                                                <div className={styles.subGroupHeader}>
                                                    <div className="flex items-center gap-2">
                                                        {isEditing ? (
                                                            <>
                                                                <input
                                                                    value={editSubGroupName}
                                                                    onChange={e => setEditSubGroupName(e.target.value)}
                                                                    className={styles.tinyInput}
                                                                    autoFocus
                                                                />
                                                                <button onClick={() => saveSubGroup(sg.SlNo)} className="text-green-500 hover:bg-green-100 p-1 rounded"><Check size={14} /></button>
                                                                <button onClick={cancelEditSubGroup} className="text-red-500 hover:bg-red-100 p-1 rounded"><X size={14} /></button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span>📂 {sg.SubGroupName}</span>
                                                                {!sg.IsActive && <span className="text-xs text-red-400">(Inactive)</span>}
                                                            </>
                                                        )}
                                                    </div>

                                                    {!isEditing && (
                                                        <div className={styles.actionContainer}>
                                                            <button onClick={() => startEditSubGroup(sg)} className={styles.iconAction} title="Rename"><Edit size={16} /></button>
                                                            <button onClick={() => toggleSubGroupActive(sg)} className={styles.iconAction} title={sg.IsActive ? "Deactivate" : "Activate"}>
                                                                {sg.IsActive ? <Eye size={16} /> : <EyeOff size={16} />}
                                                            </button>
                                                            <button onClick={() => deleteSubGroup(sg.SlNo)} className={`${styles.iconAction} text-red-400`} title="Delete"><Trash2 size={16} /></button>

                                                            <div className="w-px h-4 bg-gray-600/30 mx-1"></div>

                                                            <select
                                                                className={styles.tinySelect}
                                                                onChange={(e) => {
                                                                    if (e.target.value) handleAllocate(e.target.value, mod.SlNo, sg.SlNo)
                                                                }}
                                                                value=""
                                                            >
                                                                <option value="">+ Add Sub Menu</option>
                                                                {data.pages.map(p => (
                                                                    <option key={p.SlNo} value={p.SlNo}>{p.PageName}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={styles.pageList}>
                                                    {sgPages.map((p, idx) => (
                                                        p && (
                                                            <div key={idx} className={styles.pageItem}>
                                                                📄 {p.PageName}
                                                                <button onClick={() => handleRemoveAllocation(p.SlNo)} className={styles.removeBtn}><Trash2 size={14} /></button>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Direct Pages */}
                                    <div className={styles.directPages}>
                                        {modPages.map((p, idx) => (
                                            p && (
                                                <div key={idx} className={styles.pageItem}>
                                                    📄 {p.PageName}
                                                    <button onClick={() => handleRemoveAllocation(p.SlNo)} className={styles.removeBtn}><Trash2 size={14} /></button>
                                                </div>
                                            )
                                        ))}

                                        <div className={styles.addDirectPage}>
                                            <select
                                                className={styles.tinySelect}
                                                onChange={(e) => {
                                                    if (e.target.value) handleAllocate(e.target.value, mod.SlNo, null)
                                                }}
                                                value=""
                                            >
                                                <option value="">+ Add Sub Menu to {mod.ModuleName}</option>
                                                {data.pages.map(p => (
                                                    <option key={p.SlNo} value={p.SlNo}>{p.PageName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
