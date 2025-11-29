import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { api } from '../services/api';
import CardanoLogo from './common/CardanoLogo';

// Register ChartJS components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title
);

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api.getAnalyticsSummary();
                setData(result);
            } catch (err) {
                console.error("Analytics fetch error:", err);
                setError("Failed to load analytics data");
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full mt-6 py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Analytics Dashboard</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">View screening trends & rewards</p>
                    </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        );
    }

    return (
        <div className="w-full mt-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            <div
                className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between cursor-pointer bg-slate-50 dark:bg-slate-800/50"
                onClick={() => setIsOpen(false)}
            >
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                    </svg>
                    Screening Analytics
                </h3>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 transform rotate-180" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-red-500 text-sm">{error}</div>
                ) : !data ? (
                    <div className="text-center py-8 text-slate-500">No data available</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* 1. Risk Distribution */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-4 text-center">Risk Distribution</h4>
                            <div className="h-48 relative">
                                <Doughnut
                                    data={{
                                        labels: ['Low', 'Medium', 'High'],
                                        datasets: [{
                                            data: [
                                                data.riskDistribution.low,
                                                data.riskDistribution.medium,
                                                data.riskDistribution.high
                                            ],
                                            backgroundColor: [
                                                'rgba(34, 197, 94, 0.8)',  // Green
                                                'rgba(234, 179, 8, 0.8)',  // Yellow
                                                'rgba(239, 68, 68, 0.8)',  // Red
                                            ],
                                            borderWidth: 0
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* 2. Daily Trend */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-4 text-center">Last 7 Days Activity</h4>
                            <div className="h-48 relative">
                                <Bar
                                    data={{
                                        labels: data.dailyTrend.map(d => d.date.slice(5)), // MM-DD
                                        datasets: [{
                                            label: 'Screenings',
                                            data: data.dailyTrend.map(d => d.count),
                                            backgroundColor: 'rgba(59, 130, 246, 0.6)',
                                            borderRadius: 4
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            y: { beginAtZero: true, ticks: { stepSize: 1 } },
                                            x: { grid: { display: false } }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* 3. Rewards Growth */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2 text-center">Reward (ADA-equivalent, Cardano testnet)</h4>
                            <p className="text-[10px] text-slate-400 text-center mb-2 leading-tight">
                                Worker rewards are simulated as ADA-equivalent tokens, designed to be distributed on Cardano in production.
                            </p>
                            <div className="h-40 relative">
                                <Line
                                    data={{
                                        labels: data.reward.daily.map(d => d.date.slice(5)),
                                        datasets: [{
                                            label: 'ADA Earned',
                                            data: data.reward.daily.map(d => d.totalAda),
                                            borderColor: 'rgba(139, 92, 246, 0.8)', // Purple
                                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                            fill: true,
                                            tension: 0.4
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            y: { beginAtZero: true },
                                            x: { grid: { display: false } }
                                        }
                                    }}
                                />
                            </div>
                            <div className="mt-2 text-center flex items-center justify-center gap-2">
                                <CardanoLogo size={20} className="text-purple-600 dark:text-purple-400" />
                                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    ₳ {data.reward.totalAda}
                                </span>
                                <span className="text-xs text-slate-500">Total Earned</span>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
