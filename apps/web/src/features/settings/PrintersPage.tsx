import React from 'react';
import { Plus, Printer } from 'lucide-react';

export const PrintersPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Printers</h2>
                    <p className="text-text-secondary">Manage network printers for label generation.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>Add Printer</span>
                </button>
            </div>

            <div className="bg-bg-primary border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Printer className="w-8 h-8 text-text-secondary" />
                    </div>
                    <h3 className="text-lg font-medium text-text-primary mb-2">No printers configured</h3>
                    <p className="text-text-secondary max-w-sm mx-auto mb-6">
                        Add a Zebra ZPL-compatible printer by IP address to enable direct printing from the platform.
                    </p>
                    <button className="text-brand-primary hover:text-brand-secondary font-medium">
                        Scan for printers
                    </button>
                </div>
            </div>
        </div>
    );
};
