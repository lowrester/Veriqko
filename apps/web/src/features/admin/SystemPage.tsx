import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { system } from '../../api/system';
import { RefreshCw, Server, AlertTriangle, CheckCircle } from 'lucide-react';

export const SystemPage: React.FC = () => {
    const [isPolling, setIsPolling] = useState(false);

    // Fetch Version Info
    const { data: version, isLoading: isLoadingVersion, refetch: refetchVersion } = useQuery({
        queryKey: ['system', 'version'],
        queryFn: system.getVersion,
    });

    // Fetch Update Status (Poll if updating)
    const { data: status } = useQuery({
        queryKey: ['system', 'status'],
        queryFn: system.getStatus,
        refetchInterval: isPolling ? 2000 : false,
    });

    // Trigger Update Mutation
    const updateMutation = useMutation({
        mutationFn: system.update,
        onSuccess: () => {
            window.alert('System update initiated');
            setIsPolling(true);
        },
        onError: (err) => {
            window.alert('Failed to start update');
            console.error(err);
        },
    });

    // Stop polling if update finishes or errors
    useEffect(() => {
        if (status) {
            if (status.is_updating) {
                setIsPolling(true);
            } else if (isPolling) {
                // Just finished
                setIsPolling(false);
                if (status.error) {
                    window.alert(`Update Failed: ${status.error}`);
                } else {
                    window.alert('Update Completed Successfully!');
                    refetchVersion();
                }
            }
        }
    }, [status, isPolling, refetchVersion]);

    const handleUpdate = () => {
        if (confirm('Are you sure you want to update the system? This will restart the server.')) {
            updateMutation.mutate('main');
        }
    };

    if (isLoadingVersion) return <div className="p-8">Loading system info...</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">System Operations</h1>
                    <p className="text-text-secondary">Manage platform updates and maintenance</p>
                </div>
                <button onClick={() => refetchVersion()} className="btn-secondary gap-2 flex items-center">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Version Card */}
                <div className="card p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-text-primary">Current Version</h3>
                            <p className="text-sm text-text-secondary">Git Commit / Tag</p>
                        </div>
                    </div>

                    <div className="text-2xl font-mono bg-bg-secondary p-3 rounded border border-border">
                        {version?.current_version || 'Unknown'}
                    </div>

                    <div className="pt-2">
                        {version?.is_update_available ? (
                            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="font-medium">Update Available: {version.latest_version}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">System is up to date</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Card */}
                <div className="card p-6 space-y-6">
                    <h3 className="font-semibold text-lg text-text-primary">Actions</h3>

                    <div className="space-y-4">
                        <button
                            onClick={handleUpdate}
                            disabled={isPolling || updateMutation.isPending}
                            className="btn-primary w-full justify-between flex items-center"
                        >
                            <div className="flex items-center gap-2">
                                <RefreshCw className={`w-4 h-4 ${isPolling ? 'animate-spin' : ''}`} />
                                {isPolling ? 'Update in Progress...' : 'Install Latest Update'}
                            </div>
                            {!isPolling && <span className="text-xs opacity-75">v{version?.latest_version}</span>}
                        </button>

                        {/* Progress Bar */}
                        {isPolling && status && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between text-sm text-text-secondary">
                                    <span>{status.current_step}</span>
                                    <span>{status.progress_percent}%</span>
                                </div>
                                <div className="h-2 w-full bg-bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-500 ease-out"
                                        style={{ width: `${status.progress_percent}%` }}
                                    />
                                </div>
                                <p className="text-xs text-text-secondary font-mono truncate">
                                    {status.last_log}
                                </p>
                            </div>
                        )}

                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-xs text-text-secondary">
                            <p className="font-semibold mb-1">ℹ️ About Updates</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Updates will restart the API server.</li>
                                <li>Service may be unavailable for 1-2 minutes.</li>
                                <li>Automatic backups are created before updating.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
