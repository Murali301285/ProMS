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
    indexAxis: 'y', // Horizontal Bar for better readability of reasons
    responsive: true,
    plugins: {
        legend: {
            display: false,
        },
        title: {
            display: true,
            text: 'Stoppage Analysis (Duration in Hrs)',
        },
    },
    scales: {
        x: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#ccc' }
        },
        y: {
            grid: { display: false },
            ticks: { color: '#ccc' }
        }
    }
};

export default function StoppagePareto({ data }) {
    // Data: [ { Reason, Frequency, TotalDuration, CrusherName } ]
    // Aggregate by Reason across crushers? Or show Top 10 reasons?

    // Group by Reason
    const reasonGroups = data.reduce((acc, curr) => {
        if (!acc[curr.Reason]) {
            acc[curr.Reason] = 0;
        }
        acc[curr.Reason] += curr.TotalDuration;
        return acc;
    }, {});

    // Sort Descending
    const sortedReasons = Object.entries(reasonGroups)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10); // Top 10

    const labels = sortedReasons.map(([k]) => k);
    const values = sortedReasons.map(([, v]) => v);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Duration (Hrs)',
                data: values,
                backgroundColor: 'rgba(255, 159, 64, 0.8)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1,
            },
        ],
    };

    return <Bar options={options} data={chartData} />;
}
