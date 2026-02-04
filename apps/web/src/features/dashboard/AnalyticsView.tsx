import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { stats } from '@/api/stats';
import { Trophy, Flame } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
    const { data: defects = [], isLoading: loadingDefects } = useQuery({
        queryKey: ['stats', 'defects'],
        queryFn: stats.getDefects
    });

    const { data: technicians = [], isLoading: loadingTechs } = useQuery({
        queryKey: ['stats', 'technicians'],
        queryFn: () => stats.getTechnicians(7)
    });

    return (
        <div className="space-y-6">
            {/* Top Row: Heatmap & Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Defect Heatmap (Takes 2/3 width) */}
                <div className="lg:col-span-2 card">
                    <div className="flex items-center gap-2 mb-4">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <h2 className="font-semibold text-text-primary">Defect Heatmap</h2>
                    </div>

                    {loadingDefects ? (
                        <div className="h-64 flex items-center justify-center text-text-secondary">Loading...</div>
                    ) : defects.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-text-secondary">No defect data available.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-bg-secondary text-text-secondary">
                                    <tr>
                                        <th className="px-4 py-2 rounded-tl-lg">Device Model</th>
                                        <th className="px-4 py-2">Test Step</th>
                                        <th className="px-4 py-2 rounded-tr-lg text-right">Failures</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {defects.map((defect, idx) => {
                                        // Simple heatmap color logic based on count relative to max
                                        // For now, simple conditional styling
                                        const isHigh = defect.count > 10;
                                        return (
                                            <tr key={idx} className="hover:bg-bg-secondary/50">
                                                <td className="px-4 py-2 font-medium text-text-primary">{defect.model}</td>
                                                <td className="px-4 py-2 text-text-secondary">{defect.test_step}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isHigh ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                        }`}>
                                                        {defect.count}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Leaderboard (Takes 1/3 width) */}
                <div className="card h-fit">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <h2 className="font-semibold text-text-primary">Top Technicians (7d)</h2>
                    </div>

                    {loadingTechs ? (
                        <div className="py-8 text-center text-text-secondary">Loading...</div>
                    ) : technicians.length === 0 ? (
                        <div className="py-8 text-center text-text-secondary">No data available.</div>
                    ) : (
                        <div className="space-y-4">
                            {technicians.map((tech, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            index === 1 ? 'bg-gray-100 text-gray-700' :
                                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                                    'bg-bg-secondary text-text-secondary'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-text-primary">{tech.name}</p>
                                            <p className="text-xs text-text-secondary">{tech.jobs_completed} jobs</p>
                                        </div>
                                    </div>
                                    {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
