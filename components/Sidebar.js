'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react'; // Import all icons
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';

const bottomItems = [];

// Helper for strict path matching
const checkIsActive = (currentPath, menuPath, isLeaf = false) => {
    if (menuPath === '#' || !menuPath) return false;
    if (menuPath === '/dashboard') return currentPath === '/dashboard';

    // For leaf nodes (actual pages), prefer exact match or sub-routes like /edit/1
    // But prevent /dashboard/reports from matching /dashboard/reports/day-wise-production
    if (isLeaf) {
        if (currentPath === menuPath) return true;
        // Check if it is a sub-route (e.g. /details/1) but NOT a sibling path
        // We assume valid sub-routes are like /path/to/page/123 or /path/to/page/add
        // If currentPath starts with menuPath + '/', it might be a sub-route OR a sibling with same prefix.
        // Ideally, menu structure shouldn't have overlapping prefixes for siblings, but here we do.
        // So we can try to be stricter: 
        // If currentPath is exactly menuPath, return true.
        // If currentPath starts with menuPath + '/', checking if it corresponds to ANOTHER menu item is hard here without full list.
        // BUT, given the bug, "Reports Dashboard" (/reports) vs "Day Wise" (/reports/day-wise).
        // We will assume that if we are on "Day Wise", "Reports Dashboard" should NOT be active.
        return currentPath === menuPath;
    }

    // For Groups/Modules involving children, we still want prefix matching
    return currentPath === menuPath || currentPath.startsWith(menuPath + '/');
};

function NavItem({ item, pathname, expandedMenus, toggleSubMenu, isCollapsed, level = 0 }) {
    // Determine Icon
    // Modules (level 0) get specific icon or Circle
    // Pages (level > 0) get generic Circle if no specific icon
    const isLeaf = !item.subItems || item.subItems.length === 0;
    const IconComponent = item.icon && Icons[item.icon] ? Icons[item.icon] : (level === 0 ? Icons.Circle : (isLeaf ? Icons.Circle : null));
    const iconSize = level === 0 ? 20 : 7; // Smaller circle for pages (reduced by 30%)

    // Highlight Logic
    let isActive = false;
    if (item.path !== '#') {
        isActive = checkIsActive(pathname, item.path, isLeaf);
    }

    const isExpanded = expandedMenus[item.id || item.name];
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
        <div className={styles.navGroup}>
            <div
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => hasSubItems ? toggleSubMenu(item.id || item.name) : null}
                title={isCollapsed ? item.name : ''}
                style={{ paddingLeft: level > 0 ? `${(level * 0.8) + 0.5}rem` : '' }}
            >
                {/* Horizontal Connector for Subitems */}
                {level > 0 && <span style={{
                    position: 'absolute',
                    left: `${(level * 0.8) - 0.1}rem`,
                    top: '50%',
                    width: '0.6rem',
                    borderTop: '1px dashed var(--sidebar-fg)',
                    opacity: 0.3
                }}></span>}
                {!hasSubItems && item.path !== '#' ? (
                    <Link href={item.path} className={styles.link}>
                        {IconComponent && <IconComponent size={iconSize} />}
                        <span className={styles.label} style={level > 0 ? { fontSize: '0.9em', fontStyle: 'italic', opacity: 0.8 } : {}}>
                            {item.name}
                        </span>
                    </Link>
                ) : (
                    <div className={styles.link}>
                        {IconComponent && <IconComponent size={iconSize} />}
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
            setLoading(true); // Ensure loading state is set when re-fetching
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

        // Listen for menu updates
        const handleMenuUpdate = () => {
            console.log("Menu update event received, refreshing sidebar...");
            fetchMenu();
        };

        window.addEventListener('menu-updated', handleMenuUpdate);
        return () => window.removeEventListener('menu-updated', handleMenuUpdate);
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
                    <NavItem
                        key={item.name}
                        item={item}
                        pathname={pathname}
                        expandedMenus={expandedMenus}
                        toggleSubMenu={toggleSubMenu}
                        isCollapsed={isCollapsed}
                    />
                ))}
            </div>
        </aside>
    );
}
