'use client';

import { Menu, Search, Bell, User } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useState, useEffect } from 'react';
import styles from './Header.module.css';
import { getCookie } from 'cookies-next';

export default function Header({ toggleSidebar, isSidebarOpen }) {
    const { theme, toggleTheme } = useTheme();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [dbInfo, setDbInfo] = useState(null);

    useEffect(() => {
        // Fetch DB info from API or infer from cookie
        // Since we want the display name, we might need to fetch the list or simple mapping
        // For efficiency, we'll hit an API that returns current session info?
        // OR: Just fetch the DB list and match with cookie.

        async function fetchDbEnv() {
            try {
                // We'll trust the cookie 'current_db' for now, but to get DisplayName we normally need API
                // For now, let's call the db-list again and match, OR create a 'me' endpoint.
                // Simplified: Fetch db-list and match cookie.
                const res = await fetch('/api/setup/db-list');
                const dbs = await res.json();

                // Read cookie manually since this is client component or use library
                // Simple parsing:
                const match = document.cookie.match(new RegExp('(^| )current_db=([^;]+)'));
                const currentDbName = match ? match[2] : 'ProdMS_live';

                const currentDb = dbs.find(d => d.DbName === currentDbName) || dbs.find(d => d.DbName === 'ProdMS_live');
                setDbInfo(currentDb);
            } catch (e) {
                console.error("Env header fetch error", e);
            }
        }
        fetchDbEnv();
    }, []);

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

            <div className={styles.searchBar}>
                <Search size={18} className={styles.searchIcon} />
                <input type="text" placeholder="Search pages..." />
            </div>

            <div className={styles.right}>
                <button className={styles.iconBtn} onClick={toggleTheme}>
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
                <button className={styles.iconBtn}>
                    <Bell size={20} />
                    <span className={styles.badge}>3</span>
                </button>

                <div className={styles.profile} onClick={() => setUserMenuOpen(!userMenuOpen)}>
                    <div className={styles.avatar}>
                        <User size={20} />
                    </div>
                    <span className={styles.username}>Login as [Admin]</span>

                    {userMenuOpen && (
                        <div className={`${styles.dropdown} glass`}>
                            <div className={styles.dropdownItem}>Profile</div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
