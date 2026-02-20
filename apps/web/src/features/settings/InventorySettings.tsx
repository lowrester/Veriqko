import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventory, type Brand, type GadgetType, type DeviceItem } from '@/api/inventory'
import { useToastStore } from '@/stores/toastStore'
import { Plus, Pencil, Trash2, Upload, Download, X, Check, ChevronDown } from 'lucide-react'

export function InventorySettings() {
    const qc = useQueryClient()
    const toast = useToastStore(s => s.addToast)
    const [activeTab, setActiveTab] = useState<'brands' | 'types' | 'devices'>('devices')
    const fileInputRef = useRef<HTMLInputElement>(null)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold text-text-primary">Inventory Register</h2>
                    <p className="text-xs text-text-secondary">Manage brands, device types and model catalog.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => inventory.exportExcel()}
                        className="btn-secondary flex items-center gap-1.5 text-xs"
                    >
                        <Download className="w-3.5 h-3.5" /> Export Excel
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-primary flex items-center gap-1.5 text-xs"
                    >
                        <Upload className="w-3.5 h-3.5" /> Import Excel
                    </button>
                    <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden"
                        onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            try {
                                const result = await inventory.importExcel(file)
                                toast(`Imported ${result.created} devices${result.errors.length ? ` (${result.errors.length} errors)` : ''}`, result.errors.length ? 'error' : 'success')
                                qc.invalidateQueries({ queryKey: ['inventory'] })
                            } catch {
                                toast('Import failed', 'error')
                            }
                            e.target.value = ''
                        }}
                    />
                </div>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 bg-bg-secondary p-0.5 rounded-lg w-fit">
                {(['devices', 'brands', 'types'] as const).map(tab => (
                    <button key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${activeTab === tab ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        {tab === 'types' ? 'Device Types' : tab}
                    </button>
                ))}
            </div>

            {activeTab === 'brands' && <BrandsPanel toast={toast} />}
            {activeTab === 'types' && <TypesPanel toast={toast} />}
            {activeTab === 'devices' && <DevicesPanel toast={toast} />}
        </div>
    )
}

// ─── Brands Panel ────────────────────────────────────────────────────────────

function BrandsPanel({ toast }: { toast: (msg: string, type: 'success' | 'error') => void }) {
    const qc = useQueryClient()
    const [editId, setEditId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [newName, setNewName] = useState('')

    const { data: brands = [] } = useQuery({ queryKey: ['inventory', 'brands'], queryFn: inventory.getBrands })

    const create = useMutation({
        mutationFn: () => inventory.createBrand({ name: newName.trim() }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory', 'brands'] }); setNewName(''); toast('Brand created', 'success') },
        onError: () => toast('Failed', 'error')
    })

    const update = useMutation({
        mutationFn: () => inventory.updateBrand(editId!, { name: editName.trim() }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory', 'brands'] }); setEditId(null); toast('Updated', 'success') },
        onError: () => toast('Failed', 'error')
    })

    const del = useMutation({
        mutationFn: (id: string) => inventory.deleteBrand(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory', 'brands'] }); toast('Deleted', 'success') },
        onError: () => toast('Cannot delete — in use', 'error')
    })

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && newName.trim() && create.mutate()}
                    className="input flex-1" placeholder="New brand name…" />
                <button onClick={() => newName.trim() && create.mutate()} className="btn-primary flex items-center gap-1.5"><Plus className="w-4 h-4" />Add</button>
            </div>
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {brands.map((b: Brand) => (
                    <div key={b.id} className="flex items-center gap-3 px-3 py-2 bg-white hover:bg-bg-secondary transition-colors">
                        {editId === b.id ? (
                            <>
                                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && update.mutate()}
                                    className="input flex-1 py-0.5 h-8" />
                                <button onClick={() => update.mutate()} className="p-1.5 rounded-md hover:bg-green-50 text-green-600"><Check className="w-4 h-4" /></button>
                                <button onClick={() => setEditId(null)} className="p-1.5 rounded-md hover:bg-gray-50 text-gray-400"><X className="w-4 h-4" /></button>
                            </>
                        ) : (
                            <>
                                <span className="flex-1 text-sm font-medium">{b.name}</span>
                                <button onClick={() => { setEditId(b.id); setEditName(b.name) }} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => del.mutate(b.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                        )}
                    </div>
                ))}
                {brands.length === 0 && <div className="text-center py-6 text-xs text-text-secondary">No brands yet</div>}
            </div>
        </div>
    )
}

// ─── Types Panel ─────────────────────────────────────────────────────────────

function TypesPanel({ toast }: { toast: (msg: string, type: 'success' | 'error') => void }) {
    const qc = useQueryClient()
    const [editId, setEditId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [newName, setNewName] = useState('')

    const { data: types = [] } = useQuery({ queryKey: ['inventory', 'types'], queryFn: inventory.getTypes })

    const create = useMutation({
        mutationFn: () => inventory.createType({ name: newName.trim() }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory', 'types'] }); setNewName(''); toast('Type created', 'success') },
        onError: () => toast('Failed', 'error')
    })

    const update = useMutation({
        mutationFn: () => inventory.updateType(editId!, { name: editName.trim() }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory', 'types'] }); setEditId(null); toast('Updated', 'success') },
        onError: () => toast('Failed', 'error')
    })

    const del = useMutation({
        mutationFn: (id: string) => inventory.deleteType(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory', 'types'] }); toast('Deleted', 'success') },
        onError: () => toast('Cannot delete — in use', 'error')
    })

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && newName.trim() && create.mutate()}
                    className="input flex-1" placeholder="New type name…" />
                <button onClick={() => newName.trim() && create.mutate()} className="btn-primary flex items-center gap-1.5"><Plus className="w-4 h-4" />Add</button>
            </div>
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {types.map((t: GadgetType) => (
                    <div key={t.id} className="flex items-center gap-3 px-3 py-2 bg-white hover:bg-bg-secondary transition-colors">
                        {editId === t.id ? (
                            <>
                                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && update.mutate()}
                                    className="input flex-1 py-0.5 h-8" />
                                <button onClick={() => update.mutate()} className="p-1.5 rounded-md hover:bg-green-50 text-green-600"><Check className="w-4 h-4" /></button>
                                <button onClick={() => setEditId(null)} className="p-1.5 rounded-md hover:bg-gray-50 text-gray-400"><X className="w-4 h-4" /></button>
                            </>
                        ) : (
                            <>
                                <span className="flex-1 text-sm font-medium">{t.name}</span>
                                <button onClick={() => { setEditId(t.id); setEditName(t.name) }} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => del.mutate(t.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                        )}
                    </div>
                ))}
                {types.length === 0 && <div className="text-center py-6 text-xs text-text-secondary">No types yet</div>}
            </div>
        </div>
    )
}

// ─── Devices Panel ────────────────────────────────────────────────────────────

function DevicesPanel({ toast }: { toast: (msg: string, type: 'success' | 'error') => void }) {
    const qc = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [editDevice, setEditDevice] = useState<DeviceItem | null>(null)
    const [filter, setFilter] = useState('')

    const { data: devices = [] } = useQuery({ queryKey: ['inventory', 'devices'], queryFn: inventory.getDevices })
    const { data: brands = [] } = useQuery({ queryKey: ['inventory', 'brands'], queryFn: inventory.getBrands })
    const { data: types = [] } = useQuery({ queryKey: ['inventory', 'types'], queryFn: inventory.getTypes })

    const del = useMutation({
        mutationFn: (id: string) => inventory.deleteDevice(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory', 'devices'] }); toast('Deleted', 'success') },
        onError: () => toast('Cannot delete', 'error')
    })

    const filtered = devices.filter((d: DeviceItem) => {
        const q = filter.toLowerCase()
        return !q || d.model.toLowerCase().includes(q) || d.brand.name.toLowerCase().includes(q) || (d.colour || '').toLowerCase().includes(q) || (d.storage || '').toLowerCase().includes(q)
    })

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <input value={filter} onChange={e => setFilter(e.target.value)} className="input flex-1" placeholder="Search devices…" />
                <button onClick={() => { setEditDevice(null); setShowForm(true) }} className="btn-primary flex items-center gap-1.5 shrink-0">
                    <Plus className="w-4 h-4" />Add Device
                </button>
            </div>

            {showForm && (
                <DeviceForm
                    device={editDevice}
                    brands={brands}
                    types={types}
                    onClose={() => { setShowForm(false); setEditDevice(null) }}
                    onSave={() => { qc.invalidateQueries({ queryKey: ['inventory', 'devices'] }); setShowForm(false); setEditDevice(null); toast('Saved', 'success') }}
                    onError={() => toast('Failed', 'error')}
                />
            )}

            <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                    <thead className="bg-bg-secondary">
                        <tr>
                            {['Brand', 'Type', 'Model', 'Model No.', 'Colour', 'Storage', ''].map(h => (
                                <th key={h} className="text-left px-3 py-2 font-semibold text-text-secondary">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filtered.map((d: DeviceItem) => (
                            <tr key={d.id} className="bg-white hover:bg-bg-secondary transition-colors">
                                <td className="px-3 py-2 font-medium">{d.brand.name}</td>
                                <td className="px-3 py-2 text-text-secondary">{d.gadget_type.name}</td>
                                <td className="px-3 py-2 font-semibold">{d.model}</td>
                                <td className="px-3 py-2 text-text-secondary font-mono">{d.model_number || '—'}</td>
                                <td className="px-3 py-2 text-text-secondary">{d.colour || '—'}</td>
                                <td className="px-3 py-2 text-text-secondary">{d.storage || '—'}</td>
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-1 justify-end">
                                        <button onClick={() => { setEditDevice(d); setShowForm(true) }} className="p-1.5 rounded hover:bg-blue-50 text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => del.mutate(d.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={7} className="text-center py-8 text-text-secondary">No devices found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ─── Device Form ─────────────────────────────────────────────────────────────

interface DeviceFormProps {
    device: DeviceItem | null
    brands: Brand[]
    types: GadgetType[]
    onClose: () => void
    onSave: () => void
    onError: () => void
}

function DeviceForm({ device, brands, types, onClose, onSave, onError }: DeviceFormProps) {
    const [form, setForm] = useState({
        brand_id: device?.brand_id || '',
        type_id: device?.type_id || '',
        model: device?.model || '',
        model_number: device?.model_number || '',
        colour: device?.colour || '',
        storage: device?.storage || '',
    })

    const save = useMutation({
        mutationFn: () => device
            ? inventory.updateDevice(device.id, form)
            : inventory.createDevice(form),
        onSuccess: onSave,
        onError,
    })

    const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.value }))

    return (
        <div className="border border-border rounded-xl bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold">{device ? 'Edit Device' : 'New Device'}</h3>
                <button onClick={onClose}><X className="w-4 h-4 text-text-secondary" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">Brand *</label>
                    <div className="relative">
                        <select value={form.brand_id} onChange={f('brand_id')} className="input pr-8 appearance-none">
                            <option value="">Select brand…</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-text-secondary" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">Device Type *</label>
                    <div className="relative">
                        <select value={form.type_id} onChange={f('type_id')} className="input pr-8 appearance-none">
                            <option value="">Select type…</option>
                            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-text-secondary" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">Model *</label>
                    <input value={form.model} onChange={f('model')} className="input" placeholder="iPhone 15 Pro" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">Model Number</label>
                    <input value={form.model_number} onChange={f('model_number')} className="input" placeholder="A2848" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">Colour</label>
                    <input value={form.colour} onChange={f('colour')} className="input" placeholder="Black" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">Storage</label>
                    <input value={form.storage} onChange={f('storage')} className="input" placeholder="128 GB" />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
                <button onClick={onClose} className="btn-secondary text-xs">Cancel</button>
                <button
                    onClick={() => form.brand_id && form.type_id && form.model && save.mutate()}
                    disabled={save.isPending || !form.brand_id || !form.type_id || !form.model}
                    className="btn-primary text-xs"
                >
                    {save.isPending ? 'Saving…' : 'Save Device'}
                </button>
            </div>
        </div>
    )
}
