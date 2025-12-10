'use client';

import {
    TrendingUp, TrendingDown, Activity,
    BarChart2, Truck
} from 'lucide-react';
import styles from './page.module.css';

// Component for Stat Cards
function StatCard({ title, value, subValues, icon: Icon, color }) {
    return (
        <div className={`${styles.card} glass`}>
            <div className={styles.cardHeader}>
                <div className={styles.iconBox} style={{ backgroundColor: color }}>
                    <Icon color="white" size={24} />
                </div>
                <h3>{title}</h3>
            </div>
            <div className={styles.mainValue}>{value}</div>
            {subValues && (
                <div className={styles.subValues}>
                    {subValues.map((sv, idx) => (
                        <div key={idx} className={styles.subValueItem}>
                            <span>{sv.label}</span>
                            <strong>{sv.val}</strong>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Dashboard() {
    // Format number to Indian System (Lakhs/Crores)
    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-IN').format(num);
    };

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1>Dashboard</h1>
                <div className={styles.dateFilter}>
                    <input type="date" />
                    <span>to</span>
                    <input type="date" />
                    <button className={styles.btn}>Show</button>
                </div>
            </div>

            <div className={styles.grid}>
                <StatCard
                    title="Coal Production"
                    value={formatNumber(1819692)}
                    color="var(--primary)"
                    icon={Activity}
                    subValues={[
                        { label: 'Day', val: formatNumber(45000) },
                        { label: 'Month', val: formatNumber(1819692) },
                        { label: 'Avg', val: formatNumber(58000) }
                    ]}
                />
                <StatCard
                    title="OB Handling"
                    value={formatNumber(3502100)}
                    color="var(--warning)"
                    icon={Truck}
                    subValues={[
                        { label: 'Day', val: formatNumber(110000) },
                        { label: 'Month', val: formatNumber(3502100) },
                        { label: 'Avg', val: formatNumber(115000) }
                    ]}
                />
                <StatCard
                    title="Rehandling"
                    value={formatNumber(500000)}
                    color="var(--success)"
                    icon={TrendingUp}
                    subValues={[
                        { label: 'Day', val: formatNumber(12000) },
                        { label: 'Month', val: formatNumber(500000) },
                        { label: 'Avg', val: formatNumber(16000) }
                    ]}
                />
            </div>

            <div className={styles.chartsGrid}>
                <div className={`${styles.chartCard} glass`}>
                    <h3>Top 10 Performing Haulers</h3>
                    <div className={styles.chartPlaceholder}>
                        {/* Placeholder for Chart.js */}
                        <BarChart2 size={48} opacity={0.5} />
                        <p>Bar Chart: Qty Handled vs Hauler ID</p>
                    </div>
                </div>
                <div className={`${styles.chartCard} glass`}>
                    <h3>Bottom 10 Performing Haulers</h3>
                    <div className={styles.chartPlaceholder}>
                        <BarChart2 size={48} opacity={0.5} />
                        <p>Bar Chart: Qty Handled vs Hauler ID</p>
                    </div>
                </div>
                <div className={`${styles.chartCard} glass`}>
                    <h3>Top BD Equipment (Hrs)</h3>
                    <div className={styles.chartPlaceholder}>
                        <TrendingDown size={48} opacity={0.5} />
                        <p>Bar Chart: Breakdown Hrs vs Equipment</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
