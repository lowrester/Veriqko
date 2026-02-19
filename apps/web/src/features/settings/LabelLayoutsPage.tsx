import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileCode, Plus, Trash2, Edit2, X, Save } from 'lucide-react';
import { api } from '@/api/client';
import { formatDate } from '@/types';

interface LabelTemplate {
    id: string;
    name: string;
    description?: string;
    zpl_code: string;
    dimensions?: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export const LabelLayoutsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<LabelTemplate | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        zpl_code: '',
        dimensions: '4x2 inch',
        is_default: false
    });

    // Fetch templates
    const { data: templates = [], isLoading } = useQuery<LabelTemplate[]>({
        queryKey: ['label-templates'],
        queryFn: () => api.get('/printing/templates'),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: typeof formData) => api.post('/printing/templates', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['label-templates'] });
            closeModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: typeof formData) =>
            api.put(`/printing/templates/${editingTemplate?.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['label-templates'] });
            closeModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/printing/templates/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['label-templates'] });
        },
    });

    const openModal = (template?: LabelTemplate) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                name: template.name,
                description: template.description || '',
                zpl_code: template.zpl_code,
                dimensions: template.dimensions || '4x2 inch',
                is_default: template.is_default
            });
        } else {
            setEditingTemplate(null);
            setFormData({
                name: '',
                description: '',
                zpl_code: '',
                dimensions: '4x2 inch',
                is_default: false
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTemplate(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTemplate) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Label Layouts</h2>
                    <p className="text-text-secondary">Manage ZPL templates for asset tags and labels.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Layout</span>
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-text-secondary">Loading templates...</div>
            ) : templates.length === 0 ? (
                <div className="text-center py-12 p-8 border-2 border-dashed border-border rounded-xl">
                    <FileCode className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                    <p className="text-text-secondary">No label layouts configured. Create your first one to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                        <div key={template.id} className="bg-bg-primary border border-border rounded-xl p-4 hover:border-brand-primary/50 transition-colors group relative">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-2 rounded-lg ${template.is_default ? 'bg-brand-light/20 text-brand-primary' : 'bg-bg-secondary text-text-secondary'}`}>
                                    <FileCode className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-2">
                                    {template.is_default && (
                                        <span className="text-[10px] uppercase font-bold bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded">Default</span>
                                    )}
                                    <span className="text-xs font-mono bg-bg-secondary px-2 py-1 rounded text-text-secondary">{template.dimensions}</span>
                                </div>
                            </div>
                            <div className="mb-4">
                                <h3 className="font-semibold text-text-primary mb-1 group-hover:text-brand-primary transition-colors">{template.name}</h3>
                                <p className="text-sm text-text-secondary line-clamp-2">
                                    {template.description || 'No description provided.'}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                                <span className="text-[10px] text-text-secondary">
                                    Updated {formatDate(template.updated_at)}
                                </span>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openModal(template)}
                                        className="p-1.5 text-text-secondary hover:text-brand-primary hover:bg-bg-secondary rounded"
                                        title="Edit Template"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Delete this template?')) {
                                                deleteMutation.mutate(template.id);
                                            }
                                        }}
                                        className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded"
                                        title="Delete Template"
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
                    <div className="bg-bg-primary rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-border">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="text-lg font-bold text-text-primary">
                                {editingTemplate ? 'Edit Label Layout' : 'New Label Layout'}
                            </h3>
                            <button onClick={closeModal} className="text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="label">Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Standard Asset Tag"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="label">Description</label>
                                    <textarea
                                        className="input min-h-[60px]"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe what this label is used for..."
                                    />
                                </div>
                                <div>
                                    <label className="label">Dimensions</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.dimensions}
                                        onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                                        placeholder="e.g. 4x2 inch"
                                    />
                                </div>
                                <div className="flex items-end pb-3">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-border text-brand-primary focus:ring-brand-primary"
                                            checked={formData.is_default}
                                            onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium text-text-primary">Set as Default</span>
                                    </label>
                                </div>
                                <div className="col-span-2">
                                    <label className="label font-mono flex items-center justify-between">
                                        ZPL Code
                                        <a href="https://labelary.com/viewer.html" target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-primary hover:underline">ZPL Viewer &rarr;</a>
                                    </label>
                                    <textarea
                                        required
                                        className="input font-mono text-xs min-h-[200px]"
                                        value={formData.zpl_code}
                                        onChange={(e) => setFormData({ ...formData, zpl_code: e.target.value })}
                                        placeholder="^XA\n^FO50,50^A0N,50,50^FDVeriqko Label^FS\n^XZ"
                                    />
                                </div>
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
                                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Layout'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
