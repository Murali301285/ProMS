'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react'; // Import all icons
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';

const bottomItems = [
    { name: 'Logout', icon: Icons.LogOut, path: '#' },
];

// Helper for strict path matching
const checkIsActive = (currentPath, menuPath) => {
    if (menuPath === '#' || !menuPath) return false;
    if (menuPath === '/dashboard') return currentPath === '/dashboard';
    return currentPath === menuPath || currentPath.startsWith(menuPath + '/');
};

function NavItem({ item, pathname, expandedMenus, toggleSubMenu, isCollapsed, level = 0 }) {
    // Determine Icon
    const IconComponent = item.icon && Icons[item.icon] ? Icons[item.icon] : (level === 0 ? Icons.Circle : null);

    // Highlight Logic
    let isActive = false;
    if (item.path !== '#') {
        isActive = checkIsActive(pathname, item.path);
    }

    const isExpanded = expandedMenus[item.id || item.name];
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
        <div className={styles.navGroup}>
            <div
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => hasSubItems ? toggleSubMenu(item.id || item.name) : null}
                title={isCollapsed ? item.name : ''}
                style={{ paddingLeft: level > 0 ? `${(level * 0.5) + 0.5}rem` : '' }}
            >
                {!hasSubItems && item.path !== '#' ? (
                    <Link href={item.path} className={styles.link}>
                        {IconComponent && <IconComponent size={20} />}
                        <span className={styles.label} style={level > 0 ? { fontSize: '0.9em', fontStyle: 'italic', opacity: 0.8 } : {}}>
                            {item.name}
                        </span>
                    </Link>
                ) : (
                    <div className={styles.link}>
                        {IconComponent && <IconComponent size={20} />}
                        <span className={styles.label} style={level > 0 ? { fontSize: '0.9em', fontStyle: 'italic', opacity: 0.8 } : {}}>
                            {item.name}
                        </span>
                        <span className={styles.chevron}>
                            {isExpanded ? <Icons.ChevronDown size={16} /> : <Icons.ChevronRight size={16} />}
                        </span>
                    </div>
                )}
            </div>

            {hasSubItems && isExpanded && (
                <div className={styles.subMenu}>
                    {item.subItems.map(sub => (
                        <NavItem
                            key={sub.id || sub.name}
                            item={sub}
                            pathname={pathname}
                            expandedMenus={expandedMenus}
                            toggleSubMenu={toggleSubMenu}
                            isCollapsed={isCollapsed}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Sidebar({ isCollapsed, toggleSidebar }) {
    const pathname = usePathname();
    const router = useRouter();
    const [expandedMenus, setExpandedMenus] = useState({});
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMenu() {
            try {
                const res = await fetch('/api/setup/menu-tree');
                if (res.ok) {
                    const data = await res.json();
                    setMenuItems(data);
                }
            } catch (error) {
                console.error("Menu fetch failed", error);
            } finally {
                setLoading(false);
            }
        }
        fetchMenu();
    }, []);



    useEffect(() => {
        if (loading) return;

        const newExpanded = {};
        // Recursive expansion check
        const checkExpand = (items) => {
            items.forEach(item => {
                if (item.subItems) {
                    // Check if any child matches
                    const childMatch = item.subItems.some(sub =>
                        checkIsActive(pathname, sub.path)
                    ) || checkIsActive(pathname, item.path);

                    // Helper: Just expand if current path contains this item's children?
                    const hasActiveChild = (node) => {
                        if (checkIsActive(pathname, node.path)) return true;
                        if (node.subItems) return node.subItems.some(hasActiveChild);
                        return false;
                    };

                    if (hasActiveChild(item)) {
                        newExpanded[item.id || item.name] = true;
                    }
                }
            });
        };
        checkExpand(menuItems);

        setExpandedMenus(prev => ({ ...prev, ...newExpanded }));
    }, [pathname, menuItems, loading]);

    const toggleSubMenu = (id) => {
        setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed', error);
            window.location.href = '/';
        }
    };

    if (loading) return <aside className={`${styles.sidebar} ${isCollapsed ? styles.mini : ''}`}><div style={{ padding: '20px' }}>Loading...</div></aside>;

    return (
        <aside className={`${styles.sidebar} ${isCollapsed ? styles.mini : ''}`}>
            <div className={styles.header}>
                <div className={styles.logo}>ProMS 2.0</div>
                <hr className={styles.headerDivider} />
            </div>

            <nav className={styles.nav}>
                {menuItems
                    .filter(item => item.name !== 'Settings') // Exclude Settings from top
                    .map((item) => (
                        <NavItem
                            key={item.id || item.name}
                            item={item}
                            pathname={pathname}
                            expandedMenus={expandedMenus}
                            toggleSubMenu={toggleSubMenu}
                            isCollapsed={isCollapsed}
                        />
                    ))}
            </nav>

            <div className={styles.bottomNav}>
                {/* Render Settings Here if exists */}
                {menuItems.filter(m => m.name === 'Settings').map(item => (
                    <NavItem
                        key={item.id || item.name}
                        item={item}
                        pathname={pathname}
                        expandedMenus={expandedMenus}
                        toggleSubMenu={toggleSubMenu}
                        isCollapsed={isCollapsed}
                    />
                ))}

                {bottomItems.map((item) => (
                    item.name === 'Logout' ? (
                        <div key={item.name} className={styles.navGroup}>
                            <div
                                className={`${styles.navItem} ${styles.logoutItem}`}
                                onClick={handleLogout}
                                title={isCollapsed ? item.name : ''}
                            >
                                <div className={styles.link}>
                                    <item.icon size={20} />
                                    <span className={styles.label}>{item.name}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <NavItem
                            key={item.name}
                            item={item}
                            pathname={pathname}
                            expandedMenus={expandedMenus}
                            toggleSubMenu={toggleSubMenu}
                            isCollapsed={isCollapsed}
                        />
                    )
                ))}
            </div>
        </aside>
    );
}
