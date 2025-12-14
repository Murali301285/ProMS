'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TRANSACTION_CONFIG } from '@/lib/transactionConfig';
import TransactionTable from '@/components/TransactionTable';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Plus, RotateCcw } from 'lucide-react';
import styles from './page.module.css';
import * as XLSX from 'xlsx-js-style';

export default function LoadingFromMinesPage() {
    const router = useRouter();
    const config = TRANSACTION_CONFIG['loading-from-mines'];

    // 1. UI Filter State (Input only)
    const today = new Date().toISOString().split('T')[0];
    const [filters, setFilters] = useState({
        fromDate: today,
        toDate: today,
        group: '',
        equipments: [],
        search: ''
    });

    // 2. Query State (Active Data Filters)
    const [query, setQuery] = useState({
        fromDate: today,
        toDate: today,
        group: '',
        equipments: [],
        search: ''
    });

    // 3. Table State
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [limit, setLimit] = useState(50);
    const [sortBy, setSortBy] = useState(config.defaultSort || 'LoadingDate');
    const [sortOrder, setSortOrder] = useState('desc');
    
    // Lookups & Role
    const [userRole, setUserRole] = useState('');
    const [equipGroups, setEquipGroups] = useState([]);
    const [equipments, setEquipments] = useState([]); // This depends on filters.group

    // ... Load Init ...

    // Load Equipments (Depends on UI Filter Selection to allow selection)
    useEffect(() => {
        async function loadEquipments() {
             // ... Fetch based on filters.group ...
        }
        loadEquipments();
    }, [filters.group]); // Respond only to UI change for dropdown populating

    // Data Fetching (Depends on QUERY, not filters)
    const fetchData = useCallback(async (isLoadMore = false) => {
        if (loading) return;
        setLoading(true);
        try {
            const currentOffset = isLoadMore ? offset : 0;
            const params = new URLSearchParams({
                offset: currentOffset.toString(),
                limit: limit.toString(),
                fromDate: query.fromDate,
                toDate: query.toDate,
                equipmentIds: query.equipments.join(','),
                search: query.search,
                sortBy,
                sortOrder
            });
            // ... fetch ...
        } finally { setLoading(false); }
    }, [query, offset, limit, sortBy, sortOrder]); // Depend on QUERY

    // Initial Load & Query Change
    useEffect(() => {
        fetchData(false);
    }, [query, limit, sortBy, sortOrder]); // Trigger when Query or Table params change

    // Handlers
    const handleShow = () => {
        setQuery(filters); // Apply UI filters to Active Query
        setOffset(0); // Reset pagination
    };

    const handleReset = () => {
        const defaults = { fromDate: today, toDate: today, group: '', equipments: [], search: '' };
        setFilters(defaults);
        setQuery(defaults); // Immediate reset? Or wait for Show? User likely expects Reset to clear.
        setOffset(0);
    };

    // ... Render ...
    // Show LoadingOverlay if loading is true.
    // {loading && <LoadingOverlay />} -> This covers everything.
}
