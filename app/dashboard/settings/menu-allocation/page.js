'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './MenuAllocation.module.css';
import { Plus, Trash2, Edit, X, Check, Eye, EyeOff, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

export default function MenuAllocationPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ modules: [], subGroups: [], pages: [], allocations: [] });

    // UI States
    const [newSubGroupName, setNewSubGroupName] = useState('');
    const [selectedModuleForSub, setSelectedModuleForSub] = useState('');
    const [expandedModules, setExpandedModules] = useState({});

    // Edit States
    const [editingSubGroupId, setEditingSubGroupId] = useState(null);
    const [editSubGroupName, setEditSubGroupName] = useState('');

    // Drag State
    const [draggedItem, setDraggedItem] = useState(null);
    // We keep a local "optimistic" state for allocations to allow smooth drag UI
    // derived from data.allocations initially, but mutated during drag
    const [localAllocations, setLocalAllocations] = useState([]);

    const fetchMenuData = async () => {
        // Only set loading on first load to prevent flash on re-fetch
        if (!data.modules.length) setLoading(true);
        try {
            const res = await fetch('/api/settings/menu');
            const json = await res.json();
            setData(json);

            // Sync local allocations
            // We need to ensure we map allocations correctly
            // json.allocations has PageId, ModuleId, SubGroupId, SortOrder
            setLocalAllocations(json.allocations.sort((a, b) => a.SortOrder - b.SortOrder));

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenuData();
    }, []);

    const getAllocation = (pageId) => localAllocations.find(a => a.PageId === pageId);

    const handleCreateSubGroup = async () => {
        if (!newSubGroupName || !selectedModuleForSub) return toast.warning("Please enter name and select module");

        const res = await fetch('/api/settings/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create_subgroup',
                moduleId: selectedModuleForSub,
                name: newSubGroupName
            })
        });

        const json = await res.json();

        if (!res.ok) {
            toast.error(json.message || "Failed to create SubGroup");
            return;
        }

        toast.success("SubGroup created");
        window.dispatchEvent(new Event('menu-updated'));
        setNewSubGroupName('');
        fetchMenuData();
    };

    const handleAllocate = async (pageIdStr, moduleIdStr, subGroupIdStr) => {
        const pageId = parseInt(pageIdStr);
        const moduleId = parseInt(moduleIdStr);
        const subGroupId = subGroupIdStr ? parseInt(subGroupIdStr) : null;

        if (!moduleId) {
            console.error("No Module ID provided");
            return;
        }

        console.log(`Allocating Page ${pageId} to Module ${moduleId}, SubGroup ${subGroupId}`);

        // Calc new sort order (append to end)
        const relevantItems = localAllocations.filter(a =>
            a.ModuleId == moduleId &&
            (subGroupId ? (a.SubGroupId || null) == subGroupId : !a.SubGroupId)
        );

        const maxOrder = relevantItems.length > 0 ? Math.max(...relevantItems.map(i => i.SortOrder || 0)) : 0;
        const newOrder = maxOrder + 1;
        console.log(`Calculated SortOrder: ${newOrder}`);

        try {
            const res = await fetch('/api/settings/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'allocate_page',
                    pageId,
                    moduleId,
                    subGroupId,
                    sortOrder: newOrder
                })
            });

            if (res.ok) {
                toast.success("Menu allocated");
                window.dispatchEvent(new Event('menu-updated'));
                fetchMenuData();
            } else {
                const err = await res.json();
                console.error("Allocation failed:", err);
                toast.error(err.message || "Failed to allocate");
            }
        } catch (e) {
            console.error("Allocation error:", e);
            toast.error("An error occurred");
        }
    };

    const handleRemoveAllocation = async (pageId) => {
        const res = await fetch('/api/settings/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'remove_allocation',
                pageId
            })
        });

        if (res.ok) {
            toast.success("Allocation removed");
            window.dispatchEvent(new Event('menu-updated'));
            fetchMenuData();
        }
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
        const res = await fetch('/api/settings/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_subgroup', id, name: editSubGroupName })
        });

        const json = await res.json();
        if (!res.ok) {
            toast.error(json.message || "Update failed");
            return;
        }

        toast.success("SubGroup updated");
        window.dispatchEvent(new Event('menu-updated'));
        setEditingSubGroupId(null);
        fetchMenuData();
    };

    const toggleSubGroupActive = async (sg) => {
        await fetch('/api/settings/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_subgroup', id: sg.SlNo, isActive: !sg.IsActive })
        });
        window.dispatchEvent(new Event('menu-updated'));
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
            window.dispatchEvent(new Event('menu-updated'));
            fetchMenuData();
        }
    };

    const toggleModule = (id) => {
        setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // --- Drag and Drop Logic ---

    // When drag starts, store the item data
    const handleDragStart = (e, allocation) => {
        setDraggedItem(allocation);
        e.dataTransfer.effectAllowed = "move";
        // e.dataTransfer.setDragImage(e.target, 0, 0); // Optional: Custom drag image
        e.target.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        setDraggedItem(null);
        e.target.style.opacity = '1';
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Process Drop
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e, targetAllocation) => {
        e.preventDefault();

        console.log("DROP EVENT", { draggedItem, targetAllocation });

        if (!draggedItem || draggedItem.SlNo === targetAllocation.SlNo) {
            console.log("Drop ignored: No dragged item or dropped on self");
            return;
        }

        // Normalize IDs for comparison (handle potential string/int mismatch or null/undefined)
        // SubGroupId can be null in DB, so treat null/undefined/0 loosely or strictly normalize to null
        const dragModId = draggedItem.ModuleId;
        const dragSubId = draggedItem.SubGroupId || null;

        const targetModId = targetAllocation.ModuleId;
        const targetSubId = targetAllocation.SubGroupId || null;

        // Constraint: Can only reorder within the SAME Group (Module + SubGroup combination)
        const isSameGroup = (dragModId == targetModId) && (dragSubId == targetSubId); // weak equality for safety

        if (!isSameGroup) {
            console.warn("Drop rejected: Different groups", { drag: { dragModId, dragSubId }, target: { targetModId, targetSubId } });
            toast.warning("Can only reorder within the same Sub Menu group");
            return;
        }

        // Reorder Logic
        const groupItems = localAllocations.filter(a =>
            a.ModuleId == targetModId &&
            ((a.SubGroupId || null) == targetSubId)
        ).sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));

        console.log("Group Items for reorder:", groupItems);

        const draggedIndex = groupItems.findIndex(a => a.SlNo === draggedItem.SlNo);
        const targetIndex = groupItems.findIndex(a => a.SlNo === targetAllocation.SlNo);

        console.log({ draggedIndex, targetIndex });

        if (draggedIndex === -1 || targetIndex === -1) {
            console.error("Indices not found");
            return;
        }

        // Remove from old pos and insert at new pos
        const newGroupItems = [...groupItems];
        const [removed] = newGroupItems.splice(draggedIndex, 1);
        newGroupItems.splice(targetIndex, 0, removed);

        // Calculate new SortOrders (1-based)
        const updates = newGroupItems.map((item, index) => ({
            pageId: item.PageId,
            sortOrder: index + 1
        }));

        console.log("Updates payload:", updates);

        // Optimistic UI Update
        const updatedAllocations = localAllocations.map(a => {
            const update = updates.find(u => u.pageId === a.PageId);
            return update ? { ...a, SortOrder: update.sortOrder } : a;
        });

        // Ensure state update triggers re-render
        // create new array reference
        setLocalAllocations([...updatedAllocations]);

        // API Call
        try {
            await fetch('/api/settings/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_all_orders', updates })
            });
            window.dispatchEvent(new Event('menu-updated'));
        } catch (error) {
            console.error("Save order error", error);
            toast.error("Failed to save order");
            fetchMenuData(); // Revert on error
        }
    };

    if (loading && !data.modules.length) return <div className="p-8">Loading...</div>;

    const unallocatedPages = data.pages.filter(p => !localAllocations.find(a => a.PageId === p.SlNo));

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
                                <div className="flex-1">
                                    <span>{page.PageName}</span>
                                </div>
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
                            const modPages = localAllocations
                                .filter(a => a.ModuleId == mod.SlNo && !a.SubGroupId)
                                .map(a => ({ ...data.pages.find(p => p.SlNo === a.PageId), allocation: a }));

                            // Sort modPages by SortOrder
                            modPages.sort((a, b) => (a.allocation?.SortOrder || 0) - (b.allocation?.SortOrder || 0));

                            const isExpanded = expandedModules[mod.SlNo];

                            return (
                                <div key={mod.SlNo} className={styles.moduleBlock}>
                                    <div
                                        className={styles.moduleHeader}
                                        onClick={() => toggleModule(mod.SlNo)}
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        <strong>{mod.ModuleName}</strong>
                                    </div>

                                    {/* Pages & Subgroups Container - Collapsible */}
                                    {isExpanded && (
                                        <div style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>

                                            {/* SubGroups */}
                                            {modSubGroups.map(sg => {
                                                const sgPages = localAllocations
                                                    .filter(a => (a.SubGroupId || null) == sg.SlNo)
                                                    .map(a => ({ ...data.pages.find(p => p.SlNo === a.PageId), allocation: a }));

                                                // Sort sgPages
                                                sgPages.sort((a, b) => (a.allocation?.SortOrder || 0) - (b.allocation?.SortOrder || 0));

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
                                                                        <span className="text-sm font-medium">📂 {sg.SubGroupName}</span>
                                                                        {!sg.IsActive && <span className="text-xs text-red-400">(Inactive)</span>}
                                                                    </>
                                                                )}
                                                            </div>

                                                            {!isEditing && (
                                                                <div className={styles.actionContainer}>
                                                                    <button onClick={() => startEditSubGroup(sg)} className={styles.iconAction} title="Rename"><Edit size={14} /></button>
                                                                    <button onClick={() => toggleSubGroupActive(sg)} className={styles.iconAction} title={sg.IsActive ? "Deactivate" : "Activate"}>
                                                                        {sg.IsActive ? <Eye size={14} /> : <EyeOff size={14} />}
                                                                    </button>
                                                                    <button onClick={() => deleteSubGroup(sg.SlNo)} className={`${styles.iconAction} text-red-400`} title="Delete"><Trash2 size={14} /></button>

                                                                    <div className="w-px h-3 bg-gray-400/30 mx-1"></div>

                                                                    <select
                                                                        className={styles.tinySelect}
                                                                        onChange={(e) => {
                                                                            if (e.target.value) handleAllocate(e.target.value, mod.SlNo, sg.SlNo)
                                                                        }}
                                                                        value=""
                                                                    >
                                                                        <option value="">+ Add Page</option>
                                                                        {[...data.pages].sort((a, b) => a.PageName.localeCompare(b.PageName)).map(p => (
                                                                            <option key={p.SlNo} value={p.SlNo}>
                                                                                {p.PageName} {getAllocation(p.SlNo) ? '(Moved)' : ''}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className={styles.pageList}>
                                                            {sgPages.map((p, idx) => (
                                                                p && p.SlNo && (
                                                                    <div
                                                                        key={p.allocation?.SlNo || `temp-${p.SlNo}`} // Use SlNo as key for drag reliability
                                                                        className={`${styles.pageItem} ${styles.draggablePage}`}
                                                                        draggable
                                                                        onDragStart={(e) => handleDragStart(e, p.allocation)}
                                                                        onDragEnd={handleDragEnd}
                                                                        onDragOver={handleDragOver}
                                                                        onDrop={(e) => handleDrop(e, p.allocation)}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="cursor-grab text-gray-400 hover:text-gray-600">
                                                                                <GripVertical size={14} />
                                                                            </span>
                                                                            <span className="text-sm">📄 {p.PageName}</span>
                                                                        </div>
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
                                                    p && p.SlNo && (
                                                        <div
                                                            key={p.allocation?.SlNo || `direct-${p.SlNo}`}
                                                            className={`${styles.pageItem} ${styles.draggablePage}`}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, p.allocation)}
                                                            onDragEnd={handleDragEnd}
                                                            onDragOver={handleDragOver}
                                                            onDrop={(e) => handleDrop(e, p.allocation)}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="cursor-grab text-gray-400 hover:text-gray-600">
                                                                    <GripVertical size={14} />
                                                                </span>
                                                                <span className="text-sm">📄 {p.PageName}</span>
                                                            </div>
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
                                                        <option value="">+ Add Direct Page</option>
                                                        {[...data.pages].sort((a, b) => a.PageName.localeCompare(b.PageName)).map(p => (
                                                            <option key={p.SlNo} value={p.SlNo}>
                                                                {p.PageName} {getAllocation(p.SlNo) ? '(Moved)' : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
