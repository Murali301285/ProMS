'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';
import styles from '@/app/dashboard/settings/Settings.module.css';
import SearchableSelect from '@/components/SearchableSelect';

export default function DestinationMaterialMappingPage() {
    const [destinations, setDestinations] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [mappings, setMappings] = useState({}); // { destId: [ {mappingId, materialId, name}, ... ] }
    const [loading, setLoading] = useState(true);

    // Fetch Initial Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings/destination-material');
            if (res.ok) {
                const { destinations, materials, mappings } = await res.json();
                setDestinations(destinations || []);
                setMaterials(materials || []);

                // Transform mappings into lookup: destId -> array of material objects
                const mapLookup = {};
                (mappings || []).forEach(m => {
                    if (!mapLookup[m.DestinationId]) mapLookup[m.DestinationId] = [];
                    // Find material name
                    const mat = materials.find(mat => mat.id === m.MaterialId);
                    if (mat) {
                        mapLookup[m.DestinationId].push({
                            mappingId: m.id,
                            materialId: m.MaterialId,
                            name: mat.name
                        });
                    }
                });
                setMappings(mapLookup);
            } else {
                toast.error('Failed to load data');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error loading data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async (destId, materialId) => {
        if (!materialId) return;

        // Optimistic Update
        const mat = materials.find(m => m.id === materialId);
        if (!mat) return;

        const newItem = { mappingId: 'temp-' + Date.now(), materialId, name: mat.name };
        setMappings(prev => ({
            ...prev,
            [destId]: [...(prev[destId] || []), newItem]
        }));

        try {
            const res = await fetch('/api/settings/destination-material', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destinationId: destId, materialId })
            });

            if (!res.ok) throw new Error('Failed to add');
            // Refresh to get real ID
            fetchData();
            toast.success('Material added');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save mapping');
            // Revert on error? For now, fetch data handles cleanup
            fetchData();
        }
    };

    const handleRemove = async (destId, mappingId) => {
        // Optimistic Update
        setMappings(prev => ({
            ...prev,
            [destId]: prev[destId].filter(m => m.mappingId !== mappingId)
        }));

        try {
            const res = await fetch('/api/settings/destination-material', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: mappingId })
            });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Material removed');
        } catch (error) {
            console.error(error);
            toast.error('Failed to remove mapping');
            fetchData();
        }
    };

    if (loading) {
        return (
            <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Destination Material Mappings</h1>
            </div>

            <div className={styles.tableContainer} style={{ height: '642px' }}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th} style={{ width: '50px' }}>Sl No</th>
                            <th className={styles.th} style={{ width: '25%' }}>Destination</th>
                            <th className={styles.th}>Material</th>
                        </tr>
                    </thead>
                    <tbody>
                        {destinations.map(dest => {
                            const destMappings = mappings[dest.id] || [];
                            const mappedIds = destMappings.map(m => m.materialId);
                            // Filter available options for this destination
                            const availableMaterials = materials.filter(m => !mappedIds.includes(m.id));

                            return (
                                <tr key={dest.id} className={styles.tr}>
                                    <td className={styles.td} style={{ textAlign: 'center' }}>{destinations.indexOf(dest) + 1}</td>
                                    <td className={styles.td} style={{ fontWeight: 500 }}>{dest.name}</td>
                                    <td className={styles.td}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {/* Chips Container */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: destMappings.length ? '8px' : '0' }}>
                                                {destMappings.map(mapItem => (
                                                    <div
                                                        key={mapItem.mappingId}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            background: '#007bff', // Match screenshot blue
                                                            color: 'white',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        <span>{mapItem.name}</span>
                                                        <button
                                                            onClick={() => handleRemove(dest.id, mapItem.mappingId)}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: 'white',
                                                                marginLeft: '6px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                            title="Remove"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Add Input */}
                                            <div style={{ width: '300px' }}>
                                                <SearchableSelect
                                                    options={availableMaterials}
                                                    placeholder="Add Material..."
                                                    onChange={(e) => handleAdd(dest.id, e.target.value)}
                                                    value={null} // Keep it controlled null to reset after selection
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {destinations.length === 0 && (
                            <tr>
                                <td colSpan={3} className={styles.td} style={{ textAlign: 'center', padding: '20px' }}>
                                    No active destinations found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
