'use client';

import { useState, useEffect, useRef } from 'react';
import {
    ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
    Layers, Truck, Anchor, Send, Recycle, Box
} from 'lucide-react';
import styles from './page.module.css';

const sections = [
    {
        id: 'coal_prod',
        title: 'Coal Production (MT)',
        icon: Layers,
        bgClass: styles.themePeach,
        hasDetails: true,
        data: { ftd: 45000, mtd: 1819692, avg: 58000, ytd: 25000000 }
    },
    {
        id: 'ob_rem',
        title: 'OB Removal (BCM)',
        icon: Truck,
        bgClass: styles.themeBlue,
        hasDetails: true,
        data: { ftd: 110000, mtd: 3502100, avg: 115000, ytd: 42000000 }
    },
    {
        id: 'crushing',
        title: 'Crushing (MT)',
        icon: Anchor,
        bgClass: styles.themePink,
        hasDetails: true,
        data: { ftd: 42000, mtd: 1750000, avg: 56000, ytd: 24000000 }
    },
    {
        id: 'dispatch',
        title: 'Dispatch (MT)',
        icon: Send,
        bgClass: styles.themeGrey,
        hasDetails: true,
        data: { ftd: 40000, mtd: 1600000, avg: 53000, ytd: 23000000 }
    },
    {
        id: 'coal_re',
        title: 'Coal Rehandling (MT)',
        icon: Box,
        bgClass: styles.themeYellow,
        hasDetails: false, // No Details for now
        data: { ftd: 12000, mtd: 500000, avg: 16000, ytd: 6000000 }
    },
    {
        id: 'ob_re',
        title: 'OB Rehandling (BCM)',
        icon: Recycle,
        bgClass: styles.themeGreen,
        hasDetails: false, // No Details for now
        data: { ftd: 8000, mtd: 320000, avg: 10000, ytd: 4000000 }
    }
];

// Detail Dummy Data
const detailData = {
    coal_prod: [
        { cat: 'Large Scale (E)', ftd: 15000, mtd: 600000, avg: 19000, ytd: 8000000 },
        { cat: 'Large Scale (D)', ftd: 12000, mtd: 480000, avg: 15000, ytd: 6500000 },
        { cat: 'Mid Scale (E)', ftd: 10000, mtd: 400000, avg: 13000, ytd: 5500000 },
        { cat: 'Mid Scale (D)', ftd: 8000, mtd: 339692, avg: 11000, ytd: 5000000 },
        { cat: 'Total', ftd: 45000, mtd: 1819692, avg: 58000, ytd: 25000000, isTotal: true },
    ],
    ob_rem: [
        { cat: 'Large Scale (E)', ftd: 40000, mtd: 1200000, avg: 38000, ytd: 14000000 },
        { cat: 'Large Scale (D)', ftd: 35000, mtd: 1100000, avg: 34000, ytd: 13000000 },
        { cat: 'Mid Scale (E)', ftd: 20000, mtd: 700000, avg: 23000, ytd: 8000000 },
        { cat: 'Mid Scale (D)', ftd: 15000, mtd: 502100, avg: 20000, ytd: 7000000 },
        { cat: 'Total', ftd: 110000, mtd: 3502100, avg: 115000, ytd: 42000000, isTotal: true },
    ],
    crushing: [
        { cat: 'PSS-1', ftd: 12000, mtd: 450000, avg: 14000, ytd: 6000000 },
        { cat: 'PSS-2', ftd: 11000, mtd: 420000, avg: 13000, ytd: 5800000 },
        { cat: 'PSS-3', ftd: 9000, mtd: 380000, avg: 12000, ytd: 5200000 },
        { cat: 'ICP', ftd: 5000, mtd: 250000, avg: 8000, ytd: 3000000 },
        { cat: 'WP3', ftd: 5000, mtd: 250000, avg: 9000, ytd: 4000000 },
        { cat: 'Total', ftd: 42000, mtd: 1750000, avg: 56000, ytd: 24000000, isTotal: true },
    ],
    dispatch: [
        { cat: 'Nagri', ftd: 10000, mtd: 400000, avg: 13000, ytd: 6000000 },
        { cat: 'Stock Pile', ftd: 15000, mtd: 600000, avg: 20000, ytd: 9000000 },
        { cat: 'Tuli', ftd: 5000, mtd: 200000, avg: 7000, ytd: 3000000 },
        { cat: 'TP10', ftd: 5000, mtd: 200000, avg: 7000, ytd: 3000000 },
        { cat: 'WP3', ftd: 5000, mtd: 200000, avg: 6000, ytd: 2000000 },
        { cat: 'Total', ftd: 40000, mtd: 1600000, avg: 53000, ytd: 23000000, isTotal: true },
    ]
};

function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num);
}

export default function Dashboard() {
    const [activeDetail, setActiveDetail] = useState(null);
    const scrollRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);

    // State for chart toggles
    const [haulingView, setHaulingView] = useState('best'); // 'best' or 'worst'
    const [loadingView, setLoadingView] = useState('best'); // 'best' or 'worst'

    // Date Filter State (Default to Current Date)
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    useEffect(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;
        setDateRange({ from: formattedDate, to: formattedDate });
    }, []);

    // Duplicate logic for seamless loop
    // Quadruple the sections to ensure smooth long scroll
    const displaySections = [...sections, ...sections, ...sections, ...sections];

    const toggleDetail = (id) => {
        // Strip _dup suffix if present to handle active state correctly
        const realId = id.split('_dup')[0];

        if (activeDetail === realId) {
            setActiveDetail(null);
        } else {
            setActiveDetail(realId);
        }
    };

    const handleScrollLeft = () => {
        const container = scrollRef.current;
        if (container) {
            container.scrollBy({ left: -340, behavior: 'smooth' }); // Approx card width + gap
        }
    };

    const handleScrollRight = () => {
        const container = scrollRef.current;
        if (container) {
            container.scrollBy({ left: 340, behavior: 'smooth' });
        }
    };

    // Auto-scroll effect
    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        const speed = 0.5;
        let animationFrameId;

        const scroll = () => {
            if (!isPaused && scrollContainer) {
                // Robust infinite scroll logic
                // If we've scrolled past half the content (first 2 duplicated sets out of 4)
                // convert that to a percentage or pixel check.
                // Assuming uniform cards, check scrollLeft against scrollWidth.
                if (scrollContainer.scrollLeft >= (scrollContainer.scrollWidth / 2)) {
                    // Instantly jump back by exactly half the width
                    // This creates a seamless loop because the second half is a clone of the first half.
                    scrollContainer.scrollLeft = scrollContainer.scrollLeft - (scrollContainer.scrollWidth / 2);
                } else {
                    scrollContainer.scrollLeft += speed;
                }
            }
            animationFrameId = requestAnimationFrame(scroll);
        };

        animationFrameId = requestAnimationFrame(scroll);

        return () => cancelAnimationFrame(animationFrameId);
    }, [isPaused]);

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1>Analytical Dashboard</h1>
                <div className={styles.dateFilter}>
                    <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        className="bg-transparent border-none outline-none text-sm"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        className="bg-transparent border-none outline-none text-sm"
                    />
                    <button className={styles.btn}>Show</button>
                </div>
            </div>

            <div className={styles.gridContainer}> {/* Wrapper for arrows and grid */}

                {/* Left Arrow */}
                <button
                    onClick={handleScrollLeft}
                    className={`${styles.navBtn} ${styles.prevBtn}`}
                >
                    <ChevronLeft size={24} />
                </button>

                {/* Right Arrow */}
                <button
                    onClick={handleScrollRight}
                    className={`${styles.navBtn} ${styles.nextBtn}`}
                >
                    <ChevronRight size={24} />
                </button>

                <div
                    className={styles.grid}
                    ref={scrollRef}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {displaySections.map((section, index) => {
                        // Generate a unique key for duplicates using index
                        const uniqueId = `${section.id}_${index}`;
                        const serialNo = (index % sections.length) + 1;

                        return (
                            <div key={uniqueId} className={`${styles.card} glass ${section.bgClass}`}>
                                {/* Serial Number Watermark */}
                                <div className={styles.serialNumber}>{serialNo}</div>

                                {/* Header: Icon & Title */}
                                <div className={styles.cardHeader}>
                                    <div className={styles.iconBox}>
                                        <section.icon size={20} color="white" />
                                    </div>
                                    <h3 className={styles.cardTitle}>{section.title}</h3>
                                </div>

                                {/* Main Value: FTD (Day) */}
                                <div className={styles.mainValueContainer}>
                                    <div className={styles.mainValueLabel}>Day (FTD)</div>
                                    <div className={styles.mainValue}>{formatNumber(section.data.ftd)}</div>
                                </div>

                                <div className={styles.separator}></div>

                                {/* Sub Values: MTD, Avg, YTD */}
                                <div className={styles.subValuesGrid}>
                                    <div className={styles.subValueItem}>
                                        <span className={styles.subValueLabel}>Month</span>
                                        <span className={styles.subValue}>{formatNumber(section.data.mtd)}</span>
                                    </div>
                                    <div className={styles.subValueItem}>
                                        <span className={styles.subValueLabel}>Avg</span>
                                        <span className={styles.subValue}>{formatNumber(section.data.avg)}</span>
                                    </div>
                                    <div className={styles.subValueItem}>
                                        <span className={styles.subValueLabel}>Year</span>
                                        <span className={styles.subValue}>{formatNumber(section.data.ytd)}</span>
                                    </div>
                                </div>

                                {/* Details Toggle Button (Corner +) */}
                                {section.hasDetails && (
                                    <button
                                        className={styles.toggleBtn}
                                        onClick={() => toggleDetail(section.id)}
                                    >
                                        {activeDetail === section.id ? <ChevronDown size={18} /> : <span>+</span>}
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Details Section - Appears below grid */}
            {activeDetail && detailData[activeDetail] && (
                <div
                    className={`${styles.detailSection} ${sections.find(s => s.id === activeDetail)?.bgClass || ''}`}
                    onMouseEnter={() => setIsPaused(true)}
                >
                    <div className={styles.detailHeader}>
                        <span>Detailed Breakdown: {sections.find(s => s.id === activeDetail)?.title}</span>
                        <button onClick={() => setActiveDetail(null)} className={styles.closeBtn}>Close</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className={styles.detailTable}>
                            <thead>
                                <tr>
                                    <th>Category/Location</th>
                                    <th>FTD</th>
                                    <th>MTD</th>
                                    <th>Avg</th>
                                    <th>YTD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailData[activeDetail].map((row, idx) => (
                                    <tr key={idx} style={row.isTotal ? { fontWeight: 'bold', background: 'var(--card-color-light)', color: 'var(--card-color)' } : {}}>
                                        <td>{row.cat}</td>
                                        <td>{formatNumber(row.ftd)}</td>
                                        <td>{formatNumber(row.mtd)}</td>
                                        <td>{formatNumber(row.avg)}</td>
                                        <td>{formatNumber(row.ytd)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Performance Charts Section */}
            <div className={styles.chartGrid}>
                {/* Hauling Chart */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <div>
                            <div className={styles.chartTitle}>Top 10 Hauling Performance</div>
                            <div className={styles.chartSubtitle}>10 Best & Below Performers (Trip/Hr & Working Hrs)</div>
                        </div>
                        <div className={styles.chartControls}>
                            <button
                                className={`${styles.controlBtn} ${haulingView === 'best' ? styles.controlBtnActive : ''}`}
                                onClick={() => setHaulingView('best')}
                            >
                                Best
                            </button>
                            <button
                                className={`${styles.controlBtn} ${haulingView === 'worst' ? styles.controlBtnActive : ''}`}
                                onClick={() => setHaulingView('worst')}
                            >
                                Below
                            </button>
                        </div>
                    </div>

                    <div className={styles.chartBody}>
                        {/* Background Grid Lines (Approximate) */}
                        <div className={styles.gridLines}>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                        </div>

                        {/* Conditional Rendering of Bars */}
                        {haulingView === 'best' ? (
                            // 10 Best (Simulated more data)
                            [
                                { name: 'DT-12', val: 3.8, hrs: 12 }, { name: 'DT-45', val: 3.7, hrs: 11.5 },
                                { name: 'DT-08', val: 3.6, hrs: 12 }, { name: 'DT-33', val: 3.5, hrs: 10 },
                                { name: 'DT-21', val: 3.4, hrs: 11 }, { name: 'DT-05', val: 3.3, hrs: 10.5 },
                                { name: 'DT-19', val: 3.2, hrs: 11 }, { name: 'DT-67', val: 3.1, hrs: 9.5 },
                                { name: 'DT-88', val: 3.0, hrs: 10 }, { name: 'DT-91', val: 2.9, hrs: 10 }
                            ].map((d, i) => (
                                <div key={`best-${i}`} className={styles.barColumn}>
                                    <div className={styles.barWrapper}>
                                        <div
                                            className={`${styles.bar} ${styles.barHaulingBest}`}
                                            style={{ height: `${(d.val / 4) * 100}%` }}
                                        >
                                            <span className={styles.barLabel}>{d.name}</span>
                                            <span className={styles.barValue}>{d.val}</span>
                                        </div>
                                        <div className={styles.tooltip}>{d.val} Trips/Hr<br />{d.hrs} Hrs</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            // 10 Worst
                            [
                                { name: 'DT-04', val: 1.8, hrs: 9 }, { name: 'DT-56', val: 1.6, hrs: 8 },
                                { name: 'DT-11', val: 1.5, hrs: 6 }, { name: 'DT-99', val: 1.2, hrs: 7.5 },
                                { name: 'DT-02', val: 0.9, hrs: 4 }, { name: 'DT-15', val: 0.8, hrs: 3 },
                                { name: 'DT-77', val: 0.7, hrs: 5 }, { name: 'DT-31', val: 0.5, hrs: 2 },
                                { name: 'DT-40', val: 0.3, hrs: 1 }, { name: 'DT-XX', val: 0.1, hrs: 0.5 }
                            ].map((d, i) => (
                                <div key={`worst-${i}`} className={styles.barColumn}>
                                    <div className={styles.barWrapper}>
                                        <div
                                            className={`${styles.bar} ${styles.barWorst}`}
                                            style={{ height: `${(d.val / 4) * 100}%` }}
                                        >
                                            <span className={styles.barLabel}>{d.name}</span>
                                            <span className={styles.barValue}>{d.val}</span>
                                        </div>
                                        <div className={styles.tooltip}>{d.val} Trips/Hr<br />{d.hrs} Hrs</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Loading Chart */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <div>
                            <div className={styles.chartTitle}>Top 10 Loading Performance</div>
                            <div className={styles.chartSubtitle}>10 Best & Below Performers (BCM/Hr & Working Hrs)</div>
                        </div>
                        <div className={styles.chartControls}>
                            <button
                                className={`${styles.controlBtn} ${loadingView === 'best' ? styles.controlBtnActive : ''}`}
                                onClick={() => setLoadingView('best')}
                            >
                                Best
                            </button>
                            <button
                                className={`${styles.controlBtn} ${loadingView === 'worst' ? styles.controlBtnActive : ''}`}
                                onClick={() => setLoadingView('worst')}
                            >
                                Below
                            </button>
                        </div>
                    </div>

                    <div className={styles.chartBody}>
                        <div className={styles.gridLines}>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                        </div>

                        {loadingView === 'best' ? (
                            // 10 Best
                            [
                                { name: 'EX-05', val: 380, hrs: 14 }, { name: 'EX-12', val: 360, hrs: 13 },
                                { name: 'EX-09', val: 350, hrs: 13.5 }, { name: 'EX-22', val: 340, hrs: 12 },
                                { name: 'EX-01', val: 335, hrs: 12.5 }, { name: 'EX-19', val: 330, hrs: 12 },
                                { name: 'EX-08', val: 320, hrs: 11 }, { name: 'EX-15', val: 310, hrs: 10 },
                                { name: 'EX-33', val: 300, hrs: 11.5 }, { name: 'EX-41', val: 290, hrs: 10 }
                            ].map((d, i) => (
                                <div key={`best-load-${i}`} className={styles.barColumn}>
                                    <div className={styles.barWrapper}>
                                        <div
                                            className={`${styles.bar} ${styles.barLoadingBest}`}
                                            style={{ height: `${(d.val / 400) * 100}%` }}
                                        >
                                            <span className={styles.barLabel}>{d.name}</span>
                                            <span className={styles.barValue}>{d.val}</span>
                                        </div>
                                        <div className={styles.tooltip}>{d.val} BCM/Hr<br />{d.hrs} Hrs</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            // 10 Worst
                            [
                                { name: 'EX-18', val: 180, hrs: 9 }, { name: 'EX-30', val: 150, hrs: 8 },
                                { name: 'EX-04', val: 120, hrs: 5 }, { name: 'EX-07', val: 100, hrs: 6.5 },
                                { name: 'EX-14', val: 80, hrs: 4 }, { name: 'EX-29', val: 70, hrs: 3 },
                                { name: 'EX-11', val: 60, hrs: 3.5 }, { name: 'EX-50', val: 50, hrs: 2 },
                                { name: 'EX-66', val: 30, hrs: 1 }, { name: 'EX-99', val: 10, hrs: 0.5 }
                            ].map((d, i) => (
                                <div key={`worst-load-${i}`} className={styles.barColumn}>
                                    <div className={styles.barWrapper}>
                                        <div
                                            className={`${styles.bar} ${styles.barWorst}`}
                                            style={{ height: `${(d.val / 400) * 100}%` }}
                                        >
                                            <span className={styles.barLabel}>{d.name}</span>
                                            <span className={styles.barValue}>{d.val}</span>
                                        </div>
                                        <div className={styles.tooltip}>{d.val} BCM/Hr<br />{d.hrs} Hrs</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
