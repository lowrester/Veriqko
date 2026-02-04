import React, { useState } from 'react';
import { Plus, Shield, Globe, Trash2, Key, Info, Copy, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { formatDate } from '@/types';

interface ApiKey {
    id: string;
    name: string;
    key_prefix: string;
    scopes: string[];
    created_at: string;
    last_used_at: string | null;
    is_active: boolean;
    raw_key?: string; // Only present on create
}

interface Webhook {
    id: string;
    url: string;
    events: string[];
    is_active: boolean;
    created_at: string;
    failure_count: number;
}

export const IntegrationsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'api-keys' | 'webhooks'>('api-keys');
    const [isCreateKeyOpen, setIsCreateKeyOpen] = useState(false);
    const [isCreateWebhookOpen, setIsCreateWebhookOpen] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newWebhookUrl, setNewWebhookUrl] = useState('');
    const [createdKey, setCreatedKey] = useState<string | null>(null);

    // Queries
    const { data: apiKeys = [], isLoading: loadingKeys } = useQuery<ApiKey[]>({
        queryKey: ['api-keys'],
        queryFn: () => api.get('/integrations/api-keys'),
    });

    const { data: webhooks = [], isLoading: loadingHooks } = useQuery<Webhook[]>({
        queryKey: ['webhooks'],
        queryFn: () => api.get('/integrations/webhooks'),
    });

    // Mutations
    const createKeyMutation = useMutation({
        mutationFn: (name: string) => api.post<ApiKey & { raw_key: string }>('/integrations/api-keys', { name, scopes: ['read', 'write'] }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
            setCreatedKey(data.raw_key);
            setNewKeyName('');
        },
    });

    const createWebhookMutation = useMutation({
        mutationFn: (url: string) => api.post('/integrations/webhooks', { url, events: ['job.completed'] }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            setIsCreateWebhookOpen(false);
            setNewWebhookUrl('');
        },
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Integrations</h2>
                    <p className="text-text-secondary">Manage API access and event subscriptions.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
                <button
                    onClick={() => setActiveTab('api-keys')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'api-keys'
                        ? 'border-brand-primary text-brand-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                >
                    <Key className="w-4 h-4" />
                    API Keys
                </button>
                <button
                    onClick={() => setActiveTab('webhooks')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'webhooks'
                        ? 'border-brand-primary text-brand-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                >
                    <Globe className="w-4 h-4" />
                    Webhooks
                </button>
            </div>

            {/* API Keys Content */}
            {activeTab === 'api-keys' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs text-text-secondary bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <Shield className="w-3.5 h-3.5 text-blue-500" />
                            Use API keys to authenticate external systems with the Veriqko API.
                        </div>
                        <button
                            onClick={() => setIsCreateKeyOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-brand-primary text-white rounded-lg text-sm hover:bg-brand-secondary transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Generate New Key
                        </button>
                    </div>

                    {loadingKeys ? (
                        <div className="text-center py-8 text-text-secondary">Loading API keys...</div>
                    ) : apiKeys.length === 0 ? (
                        <div className="text-center py-12 bg-bg-primary border border-border rounded-xl border-dashed">
                            <Key className="w-12 h-12 text-text-secondary opacity-20 mx-auto mb-3" />
                            <p className="text-text-secondary">No API keys generated yet.</p>
                        </div>
                    ) : (
                        <div className="bg-bg-primary border border-border rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-bg-secondary border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 font-medium text-text-secondary">Name</th>
                                        <th className="px-4 py-3 font-medium text-text-secondary">Key Prefix</th>
                                        <th className="px-4 py-3 font-medium text-text-secondary">Created</th>
                                        <th className="px-4 py-3 font-medium text-text-secondary">Last Used</th>
                                        <th className="px-4 py-3 font-medium text-text-secondary w-20">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {apiKeys.map((key) => (
                                        <tr key={key.id} className="hover:bg-bg-secondary/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-text-primary">{key.name}</td>
                                            <td className="px-4 py-3 font-mono text-text-secondary">
                                                <span className="bg-bg-secondary px-1.5 py-0.5 rounded border border-border">{key.key_prefix}********</span>
                                            </td>
                                            <td className="px-4 py-3 text-text-secondary">{formatDate(key.created_at)}</td>
                                            <td className="px-4 py-3 text-text-secondary">
                                                {key.last_used_at ? formatDate(key.last_used_at) : 'Never'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button className="text-red-500 hover:text-red-700 font-medium text-xs p-1 rounded hover:bg-red-50 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Webhooks Content */}
            {activeTab === 'webhooks' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs text-text-secondary bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg border border-orange-100 dark:border-orange-900/30">
                            <Info className="w-3.5 h-3.5 text-orange-500" />
                            Subscribe to platform events (e.g. job completion) via HTTP POST.
                        </div>
                        <button
                            onClick={() => setIsCreateWebhookOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-brand-primary text-white rounded-lg text-sm hover:bg-brand-secondary transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Webhook
                        </button>
                    </div>

                    {loadingHooks ? (
                        <div className="text-center py-8 text-text-secondary">Loading webhooks...</div>
                    ) : webhooks.length === 0 ? (
                        <div className="text-center py-12 bg-bg-primary border border-border rounded-xl border-dashed">
                            <Globe className="w-12 h-12 text-text-secondary opacity-20 mx-auto mb-3" />
                            <p className="text-text-secondary">No webhooks configured.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {webhooks.map((hook) => (
                                <div key={hook.id} className="bg-bg-primary border border-border rounded-xl p-4 flex items-start justify-between group hover:border-brand-primary/50 transition-colors cursor-pointer">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">POST</span>
                                            <span className="font-medium text-text-primary text-sm">{hook.url}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {hook.events.map(event => (
                                                <span key={event} className="text-[10px] bg-bg-secondary text-text-secondary px-2 py-0.5 rounded-full border border-border font-medium">
                                                    {event}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${hook.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${hook.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {hook.is_active ? 'Active' : 'Failed'}
                                            </span>
                                        </div>
                                        <button className="text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Create API Key Modal */}
            {isCreateKeyOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-primary rounded-xl shadow-xl w-full max-w-md border border-border overflow-hidden">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="text-lg font-bold text-text-primary">Generate API Key</h3>
                            <button onClick={() => { setIsCreateKeyOpen(false); setCreatedKey(null); }} className="text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {!createdKey ? (
                                <>
                                    <p className="text-sm text-text-secondary">Give your key a descriptive name to track its usage.</p>
                                    <div>
                                        <label className="label">Key Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="input"
                                            value={newKeyName}
                                            onChange={(e) => setNewKeyName(e.target.value)}
                                            placeholder="e.g. ERP Integration"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button onClick={() => setIsCreateKeyOpen(false)} className="btn-secondary">Cancel</button>
                                        <button
                                            onClick={() => createKeyMutation.mutate(newKeyName)}
                                            disabled={!newKeyName || createKeyMutation.isPending}
                                            className="btn-primary"
                                        >
                                            {createKeyMutation.isPending ? 'Generating...' : 'Generate Key'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 rounded-lg flex gap-3">
                                        <Shield className="w-5 h-5 text-yellow-600 shrink-0" />
                                        <p className="text-xs text-yellow-800 dark:text-yellow-400 font-medium">
                                            Make sure to copy your API key now. You won't be able to see it again!
                                        </p>
                                    </div>
                                    <div className="group relative">
                                        <div className="p-3 bg-bg-secondary rounded border border-border font-mono text-xs break-all pr-12">
                                            {createdKey}
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(createdKey)}
                                            className="absolute right-2 top-2 p-1.5 bg-bg-primary border border-border rounded hover:bg-bg-secondary transition-colors"
                                        >
                                            <Copy className="w-4 h-4 text-brand-primary" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => { setIsCreateKeyOpen(false); setCreatedKey(null); }}
                                        className="w-full btn-primary"
                                    >
                                        I've copied the key
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Webhook Modal */}
            {isCreateWebhookOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-primary rounded-xl shadow-xl w-full max-w-md border border-border overflow-hidden">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="text-lg font-bold text-text-primary">Add Webhook</h3>
                            <button onClick={() => setIsCreateWebhookOpen(false)} className="text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="label">Endpoint URL</label>
                                <input
                                    type="url"
                                    required
                                    className="input"
                                    value={newWebhookUrl}
                                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                                    placeholder="https://your-api.com/webhooks/veriqko"
                                />
                            </div>
                            <div>
                                <label className="label">Events</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                                        <input type="checkbox" checked readOnly className="rounded border-border text-brand-primary" />
                                        job.completed
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-text-secondary cursor-not-allowed">
                                        <input type="checkbox" disabled className="rounded border-border" />
                                        job.created (Coming soon)
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button onClick={() => setIsCreateWebhookOpen(false)} className="btn-secondary">Cancel</button>
                                <button
                                    onClick={() => createWebhookMutation.mutate(newWebhookUrl)}
                                    disabled={!newWebhookUrl || createWebhookMutation.isPending}
                                    className="btn-primary"
                                >
                                    {createWebhookMutation.isPending ? 'Adding...' : 'Add Webhook'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
