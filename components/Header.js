'use client';

import { Menu, Search, Bell, User } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { getCookie } from 'cookies-next';

// ... imports
// ... imports
// import ProfileModal from './ProfileModal'; // Removed

export default function Header({ toggleSidebar, isSidebarOpen }) {
    // ... (Keep existing setup)
    const { theme, toggleTheme } = useTheme();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    // const [profileModalOpen, setProfileModalOpen] = useState(false); // Removed
    const [dbInfo, setDbInfo] = useState(null);

    // ... (Keep existing search logic)
    const [searchData, setSearchData] = useState([]);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const router = useRouter();
    const searchRef = useRef(null);

    // ... (Keep existing useEffects)
    useEffect(() => {
        // Fetch Search Data
        async function fetchSearchData() {
            try {
                const res = await fetch('/api/search/global-menu');
                if (res.ok) {
                    const data = await res.json();
                    setSearchData(data);
                }
            } catch (e) {
                console.error("Search fetch failed", e);
            }
        }
        fetchSearchData();

        // Environment Fetch (existing)
        async function fetchDbEnv() {
            try {
                const res = await fetch('/api/setup/db-list');
                const dbs = await res.json();
                const match = document.cookie.match(new RegExp('(^| )current_db=([^;]+)'));
                const currentDbName = match ? match[2] : 'ProdMS_live';
                const currentDb = dbs.find(d => d.DbName === currentDbName) || dbs.find(d => d.DbName === 'ProdMS_live');
                setDbInfo(currentDb);
            } catch (e) {
                console.error("Env header fetch error", e);
            }
        }
        fetchDbEnv();

        // Click Outside to Close
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (val) => {
        setQuery(val);
        if (!val.trim()) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        const filtered = searchData.filter(item =>
            item.name.toLowerCase().includes(val.toLowerCase()) ||
            item.module.toLowerCase().includes(val.toLowerCase())
        ).slice(0, 10); // Limit to 10

        setResults(filtered);
        setShowDropdown(true);
        setHighlightedIndex(filtered.length > 0 ? 0 : -1);
    };

    const handleNavigate = (item) => {
        if (item && item.isAuthorized) {
            router.push(item.path);
            setQuery('');
            setShowDropdown(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && results[highlightedIndex]) {
                handleNavigate(results[highlightedIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    return (
        <header className={`${styles.header} glass`}>
            <div className={styles.left}>
                <button onClick={toggleSidebar} className={styles.menuBtn}>
                    <Menu size={24} />
                </button>

                {dbInfo && (
                    <div className={`${styles.envBadge} ${styles[dbInfo.Environment.toLowerCase()] || ''}`}>
                        <span className={styles.envLabel}>Environment:</span>
                        <span className={styles.envName}>{dbInfo.DisplayName}</span>
                        <span className={styles.envTag}>{dbInfo.Environment}</span>
                    </div>
                )}
            </div>

            <div className={styles.searchBar} ref={searchRef}>
                <Search size={18} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search pages..."
                    value={query}
                    onChange={e => handleSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (query) setShowDropdown(true); }}
                />

                {showDropdown && (
                    <div className={styles.searchResults}>
                        {results.length > 0 ? (
                            results.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`${styles.searchResultItem} ${index === highlightedIndex ? styles.highlighted : ''} ${!item.isAuthorized ? styles.disabled : ''}`}
                                    onClick={() => handleNavigate(item)}
                                >
                                    <span className="font-medium flex items-center gap-2">
                                        {item.name}
                                        {!item.isAuthorized && <span className="text-xs text-red-400 border border-red-200 px-1 rounded">Locked</span>}
                                    </span>
                                    <span className={styles.resultPath}>
                                        {item.module} {item.subGroup ? `> ${item.subGroup}` : ''}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500">No results found</div>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.right}>
                <button className={styles.iconBtn} onClick={toggleTheme}>
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
                {/* Alert Hidden for now */}
                {/* <button className={styles.iconBtn}>
                    <Bell size={20} />
                    <span className={styles.badge}>3</span>
                </button> */}

                <div className={styles.profile} onClick={() => setUserMenuOpen(!userMenuOpen)}>
                    <div className={styles.avatar}>
                        <User size={20} />
                    </div>
                    <span className={styles.username}>Login as [Admin]</span>

                    {userMenuOpen && (
                        <div className={`${styles.dropdown} glass`}>
                            <div
                                className={styles.dropdownItem}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setUserMenuOpen(false);
                                    router.push('/dashboard/profile'); // Navigate to new page
                                }}
                            >
                                Profile
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} /> */}
        </header>
    );
}
