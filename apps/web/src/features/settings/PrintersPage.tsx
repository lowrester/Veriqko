import React, { useState } from 'react';
import { Plus, Printer as PrinterIcon, Trash2, Edit2, X, Save, Activity, Globe, Monitor } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { formatDate } from '@/types';

interface Printer {
    id: string;
    name: string;
    ip_address: string;
    port: number;
    protocol: string;
    is_active: boolean;
    station_id?: string;
    created_at: string;
    updated_at: string;
}

export const PrintersPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        ip_address: '',
        port: 9100,
        protocol: 'ZPL',
        is_active: true,
        station_id: ''
    });

    // Fetch printers
    const { data: printers = [], isLoading } = useQuery<Printer[]>({
        queryKey: ['printers'],
        queryFn: () => api.get('/printing/printers'),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: typeof formData) => api.post('/printing/printers', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['printers'] });
            closeModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: typeof formData) =>
            api.put(`/printing/printers/${editingPrinter?.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['printers'] });
            closeModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/printing/printers/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['printers'] });
        },
    });

    const openModal = (printer?: Printer) => {
        if (printer) {
            setEditingPrinter(printer);
            setFormData({
                name: printer.name,
                ip_address: printer.ip_address,
                port: printer.port,
                protocol: printer.protocol,
                is_active: printer.is_active,
                station_id: printer.station_id || ''
            });
        } else {
            setEditingPrinter(null);
            setFormData({
                name: '',
                ip_address: '',
                port: 9100,
                protocol: 'ZPL',
                is_active: true,
                station_id: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPrinter(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPrinter) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Printers</h2>
                    <p className="text-text-secondary">Manage network printers for label generation.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Printer</span>
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-text-secondary">Loading printers...</div>
            ) : printers.length === 0 ? (
                <div className="bg-bg-primary border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            <PrinterIcon className="w-8 h-8 text-text-secondary" />
                        </div>
                        <h3 className="text-lg font-medium text-text-primary mb-2">No printers configured</h3>
                        <p className="text-text-secondary max-w-sm mx-auto mb-6">
                            Add a Zebra ZPL-compatible printer by IP address to enable direct printing from the platform.
                        </p>
                        <button
                            onClick={() => openModal()}
                            className="text-brand-primary hover:text-brand-secondary font-medium"
                        >
                            Configure your first printer
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {printers.map((printer) => (
                        <div key={printer.id} className="card group relative">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${printer.is_active ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-bg-secondary text-text-secondary'}`}>
                                    <PrinterIcon className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${printer.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/40' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${printer.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                        {printer.is_active ? 'Online' : 'Disabled'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-bold text-text-primary text-lg">{printer.name}</h3>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                                        <Globe className="w-4 h-4" />
                                        <span>{printer.ip_address}:{printer.port}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                                        <Activity className="w-4 h-4" />
                                        <span>Protocol: {printer.protocol}</span>
                                    </div>
                                    {printer.station_id && (
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <Monitor className="w-4 h-4" />
                                            <span>Assigned to Station</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
                                <span className="text-[10px] text-text-secondary font-mono">
                                    Updated {formatDate(printer.updated_at)}
                                </span>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openModal(printer)}
                                        className="p-1.5 text-text-secondary hover:text-brand-primary hover:bg-bg-secondary rounded"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Remove this printer?')) {
                                                deleteMutation.mutate(printer.id);
                                            }
                                        }}
                                        className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-primary rounded-xl shadow-xl w-full max-w-lg border border-border overflow-hidden">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="text-lg font-bold text-text-primary">
                                {editingPrinter ? 'Edit Printer' : 'Add New Printer'}
                            </h3>
                            <button onClick={closeModal} className="text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="label">Printer Name</label>
                                <input
                                    type="text"
                                    required
                                    className="input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Shipping Zebra 1"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="label">IP Address</label>
                                    <input
                                        type="text"
                                        required
                                        className="input"
                                        value={formData.ip_address}
                                        onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                                        placeholder="192.168.1.100"
                                    />
                                </div>
                                <div>
                                    <label className="label">Port</label>
                                    <input
                                        type="number"
                                        required
                                        className="input"
                                        value={formData.port}
                                        onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Protocol</label>
                                    <select
                                        className="input"
                                        value={formData.protocol}
                                        onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                                    >
                                        <option value="ZPL">ZPL (Zebra)</option>
                                        <option value="TSPL">TSPL (TSC)</option>
                                        <option value="ESC/P">ESC/P (Epson)</option>
                                    </select>
                                </div>
                                <div className="flex items-end pb-3">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-border text-brand-primary focus:ring-brand-primary"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium text-text-primary">Enabled</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="label">Assign to Station (Optional)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.station_id}
                                    onChange={(e) => setFormData({ ...formData, station_id: e.target.value })}
                                    placeholder="Station ID"
                                />
                            </div>
                        </form>

                        <div className="p-4 border-t border-border bg-bg-secondary flex justify-end gap-3">
                            <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Printer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
