
// Simulation of menu-tree logic with hardcoded data found in previous step

const modules = [
    { SlNo: 1, ModuleName: 'Dashboard', Icon: 'LayoutDashboard', SortOrder: 1 },
    { SlNo: 2, ModuleName: 'Master', Icon: 'Database', SortOrder: 2 },
    { SlNo: 4, ModuleName: 'Transactions', Icon: 'ArrowRightLeft', SortOrder: 3 },
    { SlNo: 3, ModuleName: 'Authorization', Icon: 'ShieldCheck', SortOrder: 4 },
    { SlNo: 1005, ModuleName: 'Reports', Icon: 'FileText', SortOrder: 5 } // ID from debug output
];

const subGroups = [
    // ... existing subgroups ...
    { SlNo: 1, SubGroupName: 'User Management', ModuleId: 3, SortOrder: 1 },
    { SlNo: 2, SubGroupName: 'General Master', ModuleId: 2, SortOrder: 1 },
    { SlNo: 3, SubGroupName: 'Mine Master', ModuleId: 2, SortOrder: 2 },
    { SlNo: 4, SubGroupName: 'Transport Master', ModuleId: 2, SortOrder: 3 }
];

// Pages fetched from debug output
const authorizedPages = [
    { ModuleId: 1005, SubGroupId: null, PageId: 6, PageName: 'Material Loading', Url: '/dashboard/reports/material-loading', SortOrder: 1 },
    { ModuleId: 1005, SubGroupId: null, PageId: 18, PageName: 'Reports Dashboard', Url: '/dashboard/reports/dashboard', SortOrder: 2 }
];

console.log("Authorized Pages for Reports:", authorizedPages.filter(p => p.ModuleId === 1005));

// LOGIC FROM route.js
const menuTree = modules.map(module => {
    // 1. SubGroups
    const moduleSubGroups = subGroups
        .filter(sg => sg.ModuleId === module.SlNo)
        .map(sg => {
            const sgPages = authorizedPages.filter(p => p.SubGroupId === sg.SlNo && p.ModuleId === module.SlNo);
            return {
                name: sg.SubGroupName,
                path: '#',
                subItems: sgPages.map(p => ({
                    name: p.PageName,
                    path: p.Url
                }))
            };
        })
        .filter(sg => sg.subItems.length > 0);

    // 2. Direct Pages
    // SUSPICION: strict equality check on SubGroupId might fail if one is null and other is undefined or 0
    const directPages = authorizedPages
        .filter(p => p.ModuleId === module.SlNo && !p.SubGroupId)
        .map(p => ({
            name: p.PageName,
            path: p.Url
        }));

    console.log(`Module: ${module.ModuleName}, Direct Pages:`, directPages.length);

    const subItems = [...moduleSubGroups, ...directPages];

    return {
        name: module.ModuleName,
        path: '#',
        icon: module.Icon,
        subItems: subItems
    };
}).filter(m => m.subItems.length > 0);

console.log("Final Tree:", JSON.stringify(menuTree, null, 2));
