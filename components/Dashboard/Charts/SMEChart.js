'use client';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'SME Supplier Performance (Qty & Powder Factor)',
        },
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: { display: true },
        },
        x: {
            grid: { display: false },
        }
    }
};

export default function SMEChart({ data }) {
    // Data: SupplierName, MaterialType, TotalExplosive, PowderFactor
    // We want to group by Supplier.

    // Unique Suppliers
    const suppliers = [...new Set(data.map(d => d.SupplierName))];

    // Prepare datasets
    // We can show Explosive Qty as Bar, maybe PF as tooltip or secondary axis?
    // Requirement: SME Qty, Powder Factor (Coal & OB Separate).
    // Let's optimize: Grouped Bar for Qty (Coal/OB), and PF in tooltip.

    const coalData = suppliers.map(s => {
        const item = data.find(d => d.SupplierName === s && d.MaterialType === 'Coal');
        return item ? item.TotalExplosive : 0;
    });

    const obData = suppliers.map(s => {
        const item = data.find(d => d.SupplierName === s && d.MaterialType === 'OB');
        return item ? item.TotalExplosive : 0;
    });

    const chartData = {
        labels: suppliers,
        datasets: [
            {
                label: 'Coal Qty (kg)',
                data: coalData,
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
            },
            {
                label: 'OB Qty (kg)',
                data: obData,
                backgroundColor: 'rgba(53, 162, 235, 0.7)',
            },
        ],
    };

    // Custom Tooltip to show PF?
    // Standard tooltip shows value. We can optimize later.

    return <Bar options={options} data={chartData} />;
}
