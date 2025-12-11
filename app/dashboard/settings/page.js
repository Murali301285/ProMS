
import Link from 'next/link';
import { Settings, Menu, Shield } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Settings className="text-primary" /> Settings
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Menu Allocation */}
                <Link href="/dashboard/settings/menu-allocation" className="block group">
                    <div className="bg-card p-6 rounded-lg border border-border hover:border-primary transition-all shadow-sm hover:shadow-md glass">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                                <Menu size={24} />
                            </div>
                            <h2 className="text-lg font-semibold">Menu Allocation</h2>
                        </div>
                        <p className="text-sm opacity-70">
                            Configure the sidebar menu, create sub-groups, and assign pages to modules.
                        </p>
                    </div>
                </Link>

                {/* DB Config */}
                <Link href="/dashboard/settings/db-config" className="block group">
                    <div className="bg-card p-6 rounded-lg border border-border hover:border-primary transition-all shadow-sm hover:shadow-md glass">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                                <Settings size={24} />
                            </div>
                            <h2 className="text-lg font-semibold">DB Configuration</h2>
                        </div>
                        <p className="text-sm opacity-70">
                            Manage database connections and environments.
                        </p>
                    </div>
                </Link>

                {/* Menu Master */}
                <Link href="/dashboard/settings/menus" className="block group">
                    <div className="bg-card p-6 rounded-lg border border-border hover:border-primary transition-all shadow-sm hover:shadow-md glass">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                                <Menu size={24} />
                            </div>
                            <h2 className="text-lg font-semibold">Menus (Modules)</h2>
                        </div>
                        <p className="text-sm opacity-70">
                            Create and manage top-level menu modules.
                        </p>
                    </div>
                </Link>

                {/* Sub Menu Master */}
                <Link href="/dashboard/settings/sub-menus" className="block group">
                    <div className="bg-card p-6 rounded-lg border border-border hover:border-primary transition-all shadow-sm hover:shadow-md glass">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                                <Menu size={24} />
                            </div>
                            <h2 className="text-lg font-semibold">Sub Menus (Pages)</h2>
                        </div>
                        <p className="text-sm opacity-70">
                            Register new pages and paths for the application.
                        </p>
                    </div>
                </Link>


                {/* Equipment Owner Type */}
                <Link href="/dashboard/master/equipment-owner-type" className="block group">
                    <div className="bg-card p-6 rounded-lg border border-border hover:border-primary transition-all shadow-sm hover:shadow-md glass">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                                <Settings size={24} />
                            </div>
                            <h2 className="text-lg font-semibold">Equipment Owner Type</h2>
                        </div>
                        <p className="text-sm opacity-70">
                            Manage equipment owner types.
                        </p>
                    </div>
                </Link>

                {/* Audit Logs */}
                <Link href="/dashboard/settings/audit-logs" className="block group">
                    <div className="bg-card p-6 rounded-lg border border-border hover:border-primary transition-all shadow-sm hover:shadow-md glass">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-secondary rounded-full text-secondary-foreground group-hover:scale-110 transition-transform">
                                <Shield size={24} />
                            </div>
                            <h2 className="text-lg font-semibold">Audit Logs</h2>
                        </div>
                        <p className="text-sm opacity-70">
                            View system audit logs and history.
                        </p>
                    </div>
                </Link>

            </div>
        </div>
    );
}
