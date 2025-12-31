'use client';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'right',
        },
        title: {
            display: true,
            text: 'Explosive Type Usage (%)',
        }
    },
    cutout: '70%',
};

export default function ExplosiveDonut({ data }) {
    // Data: { TotalSME, TotalLDE, TotalANFO, GrandTotal }

    if (!data) return null;

    const chartData = {
        labels: ['SME', 'LDE', 'ANFO'],
        datasets: [
            {
                label: 'Qty (kg)',
                data: [data.TotalSME, data.TotalLDE, data.TotalANFO],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const total = data.GrandTotal || 1;
    const items = [
        { label: 'SME', value: data.TotalSME, color: 'rgba(255, 99, 132, 1)' },
        { label: 'LDE', value: data.TotalLDE, color: 'rgba(54, 162, 235, 1)' },
        { label: 'ANFO', value: data.TotalANFO, color: 'rgba(255, 206, 86, 1)' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
            <div style={{ height: '220px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <Doughnut data={chartData} options={options} />
            </div>
            {/* Custom Legend/Details */}
            <div style={{ marginTop: '1rem', width: '100%', fontSize: '0.85rem' }}>
                {items.map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', padding: '0 1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--foreground)' }}>
                            <span style={{ width: '10px', height: '10px', background: item.color, borderRadius: '2px', display: 'inline-block' }}></span>
                            {item.label}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                            {item.value.toLocaleString()} kg <span style={{ opacity: 0.6, fontWeight: 400 }}>({Math.round((item.value / total) * 100)}%)</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
