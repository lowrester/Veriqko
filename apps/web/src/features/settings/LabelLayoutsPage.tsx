import React from 'react';
import { FileCode, Plus } from 'lucide-react';

export const LabelLayoutsPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Label Layouts</h2>
                    <p className="text-text-secondary">Manage ZPL templates for asset tags and labels.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>New Layout</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Mock Card */}
                <div className="bg-bg-primary border border-border rounded-xl p-4 hover:border-brand-primary/50 transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-brand-light/20 rounded-lg text-brand-primary">
                            <FileCode className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-mono bg-bg-secondary px-2 py-1 rounded text-text-secondary">4x2 inch</span>
                    </div>
                    <h3 className="font-semibold text-text-primary mb-1 group-hover:text-brand-primary transition-colors">Standard Asset Tag</h3>
                    <p className="text-sm text-text-secondary line-clamp-2">
                        Default 4x2 label containing Company Logo, Asset ID, Serial Number (Code 128), and Specs.
                    </p>
                </div>

                <div className="bg-bg-primary border border-border rounded-xl p-4 hover:border-brand-primary/50 transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg">
                            <FileCode className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-mono bg-bg-secondary px-2 py-1 rounded text-text-secondary">2x1 inch</span>
                    </div>
                    <h3 className="font-semibold text-text-primary mb-1 group-hover:text-brand-primary transition-colors">Small QR Tag</h3>
                    <p className="text-sm text-text-secondary line-clamp-2">
                        Compact QR code only label for cables and accessories.
                    </p>
                </div>
            </div>
        </div>
    );
};
