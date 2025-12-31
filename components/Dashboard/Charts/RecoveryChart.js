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
            text: 'Recovery (Coal vs OB)',
        },
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: { display: true },
        },
        x: {
            grid: {
                display: false
            },
        }
    }
};

export default function RecoveryChart({ data }) {
    // Expected data: { coal: number, ob: number }
    // Or array of objects? The SP returns rows.
    // SP: Category (Coal/OB), TotalMeters

    const labels = data.map(d => d.Category);
    const values = data.map(d => d.TotalMeters);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Drill Meters',
                data: values,
                backgroundColor: labels.map(l => l === 'Coal' ? 'rgba(255, 99, 132, 0.7)' : 'rgba(53, 162, 235, 0.7)'),
                borderColor: labels.map(l => l === 'Coal' ? 'rgba(255, 99, 132, 1)' : 'rgba(53, 162, 235, 1)'),
                borderWidth: 1,
            },
        ],
    };

    return <Bar options={options} data={chartData} />;
}
