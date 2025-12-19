'use client';

import {
    TrendingUp,
    BarChart3,
    Truck,
    Clock,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './Dashboard.module.css';

/**
 * Reports Dashboard - Visual Overview
 */
export default function ReportsDashboard() {
    const router = useRouter();

    const stats = [
        {
            title: "Total Material Moved",
            value: "145,230 MT",
            change: "+12.5%",
            trend: "up",
            trend: "up",
            icon: Truck,
            colorVariant: "blue"
        },
        {
            title: "Active Trips Today",
            value: "432",
            change: "+4.1%",
            trend: "up",
            trend: "up",
            icon: TrendingUp,
            colorVariant: "emerald"
        },
        {
            title: "Avg. Cycle Time",
            value: "42 min",
            change: "-2.3%",
            trend: "down", // Good for cycle time
            trend: "down", // Good for cycle time
            icon: Clock,
            colorVariant: "violet"
        },
        {
            title: "Production Efficiency",
            value: "94.2%",
            change: "+1.2%",
            trend: "up",
            icon: BarChart3,
            colorVariant: "orange"
        }
    ];

    const reportLinks = [
        {
            title: "Material Loading Report",
            desc: "Detailed logs of all material loading transactions, source, and destination.",
            icon: Truck,
            path: "/dashboard/reports/material-loading",
            colorVariant: "blue"
        },
        {
            title: "Production Summary",
            desc: "Shift-wise production analysis with operator performance metrics.",
            icon: BarChart3,
            path: "/dashboard/reports/production", // Placeholder
            colorVariant: "emerald"
        },
        {
            title: "Consumption Analysis",
            desc: "Fuel and resource consumption trends over time.",
            icon: TrendingUp,
            path: "#",
            colorVariant: "violet"
        }
    ];

    return (
        <div className={styles.pageContainer}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Reports Overview</h1>
                <p className={styles.subtitle}>Real-time insights and operational metrics</p>
            </div>

            {/* KPI Cards */}
            <div className={styles.gridStats}>
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className={`${styles.statCard} ${styles[stat.colorVariant]}`}
                    >
                        <div className={styles.statHeader}>
                            <div className={styles.iconBox}>
                                <stat.icon size={24} strokeWidth={2} />
                            </div>
                            <div className={`${styles.trendBox} ${stat.trend === 'up' ?
                                (stat.title.includes('Cycle') ? styles.trendDown : styles.trendUp) :
                                (stat.title.includes('Cycle') ? styles.trendUp : styles.trendDown)}`}>
                                {stat.change}
                                {stat.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            </div>
                        </div>
                        <h3 className={styles.statTitle}>{stat.title}</h3>
                        <p className={styles.statValue}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Quick Access Grid */}
            <h2 className={styles.sectionTitle}>
                <Calendar size={20} className="text-slate-400" />
                Available Reports
            </h2>

            <div className={styles.gridReports}>
                {reportLinks.map((report, i) => (
                    <div
                        key={i}
                        onClick={() => router.push(report.path)}
                        className={`${styles.reportCard} ${styles[report.colorVariant]}`}
                    >
                        <div className={styles.bgIcon}>
                            <report.icon size={120} />
                        </div>

                        <div className={styles.reportIconBox}>
                            <report.icon size={24} />
                        </div>
                        <h3 className={styles.reportCardTitle}>
                            {report.title}
                        </h3>
                        <p className={styles.reportDesc}>
                            {report.desc}
                        </p>

                        <div className={styles.viewAction}>
                            View Report <ArrowUpRight size={16} className="ml-1" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
