import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '@/api/client'
import { inventory, type Brand, type GadgetType, type DeviceItem } from '@/api/inventory'
import {
    ArrowLeft, AlertOctagon, Check, Search,
    Printer as PrinterIcon, ArrowRight, ChevronDown, Plus,
    ChevronRight,
} from 'lucide-react'
import { PrintLabelModal } from '../printing/components/PrintLabelModal'
import { useToastStore } from '@/stores/toastStore'

const EMPTY_FORM = {
    serial_number: '', imei: '', brand: '', device_type: '', model: '',
    model_number: '', colour: '', storage: '', customer_reference: '', batch_id: '', condition_notes: '',
}

export function IntakeNewPage() {
    const navigate = useNavigate()
    const toast = useToastStore(s => s.addToast)

    const [form, setForm] = useState({ ...EMPTY_FORM })
    const [selectedBrandId, setSelectedBrandId] = useState('')
    const [selectedTypeId, setSelectedTypeId] = useState('')
    const [selectedDeviceId, setSelectedDeviceId] = useState('')
    const [imeiAlert, setImeiAlert] = useState<{ is_blacklisted: boolean; reason?: string } | null>(null)
    const [createdJob, setCreatedJob] = useState<any>(null)
    const [showPrint, setShowPrint] = useState(false)

    const { data: brands = [] } = useQuery<Brand[]>({ queryKey: ['inv', 'brands'], queryFn: inventory.getBrands })
    const { data: types = [] } = useQuery<GadgetType[]>({ queryKey: ['inv', 'types'], queryFn: inventory.getTypes })
    const { data: devices = [] } = useQuery<DeviceItem[]>({ queryKey: ['inv', 'devices'], queryFn: inventory.getDevices })

    const filteredDevices = devices.filter(d =>
        (!selectedBrandId || d.brand_id === selectedBrandId) &&
        (!selectedTypeId || d.type_id === selectedTypeId)
    )
    const uniqueModels = filteredDevices.reduce<DeviceItem[]>((acc, d) => {
        if (!acc.find(x => x.model === d.model)) acc.push(d); return acc
    }, [])
    const colourOptions = filteredDevices.filter(d => d.model === form.model && d.colour).map(d => d.colour!)
    const storageOptions = filteredDevices.filter(d => d.model === form.model && d.colour === form.colour && d.storage).map(d => d.storage!)

    const handleDeviceSelect = (id: string) => {
        const d = devices.find(x => x.id === id); if (!d) return
        setSelectedDeviceId(id)
        setForm(p => ({ ...p, brand: d.brand.name, device_type: d.gadget_type.name, model: d.model, model_number: d.model_number || '', colour: d.colour || '', storage: d.storage || '' }))
    }
    const checkImei = async (imei: string) => {
        if (imei.length < 14) return
        try { setImeiAlert(await api.get(`/jobs/security/check-imei/${imei}`) as any) } catch { }
    }

    const create = useMutation({
        mutationFn: () => api.post('/jobs', form),
        onSuccess: (job: any) => { setCreatedJob(job); toast(`Job #${job.ticket_id} created`, 'success') },
        onError: () => toast('Failed to create job', 'error'),
    })

    const step1Done = Boolean(form.serial_number)
    const step2Done = Boolean(form.brand && form.device_type && form.model)
    const step3Done = Boolean(createdJob)
    const canSubmit = step1Done && step2Done && !createdJob

    const resetForm = () => {
        setForm({ ...EMPTY_FORM })
        setSelectedBrandId(''); setSelectedTypeId(''); setSelectedDeviceId('')
        setImeiAlert(null); setCreatedJob(null)
    }

    return (
        <div className="py-3 px-4 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <Link to="/dashboard" className="p-1.5 hover:bg-white rounded-lg transition-colors">
                    <ArrowLeft className="w-4 h-4 text-text-secondary" />
                </Link>
                <div>
                    <h1 className="text-sm font-bold">New Intake</h1>
                    <p className="text-xs text-text-secondary">Complete each step — last step closes the job.</p>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────
          ROW 1: Step 1 → Step 2 → Step 3
          ───────────────────────────────────────────────────────── */}
            <div className="flex items-stretch gap-0 mb-0">

                {/* ── 1: Identification ── */}
                <StepCard number={1} label="Identification" done={step1Done} active={!step1Done}>
                    <div className="space-y-2">
                        <div>
                            <label className="field-label">Serial *</label>
                            <div className="relative">
                                <input autoFocus type="text" value={form.serial_number}
                                    onChange={e => setForm(p => ({ ...p, serial_number: e.target.value }))}
                                    className="input h-9 font-mono text-center tracking-widest text-sm"
                                    placeholder="SCAN SERIAL" autoComplete="off" />
                                <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-30 text-text-secondary" />
                            </div>
                        </div>
                        <div>
                            <label className="field-label">IMEI <span className="normal-case font-normal text-text-secondary">(opt.)</span></label>
                            <input type="text" value={form.imei}
                                onChange={e => { setForm(p => ({ ...p, imei: e.target.value })); checkImei(e.target.value) }}
                                className={`input h-9 text-center text-sm ${imeiAlert?.is_blacklisted ? 'border-red-500 bg-red-50' : ''}`}
                                placeholder="35…" />
                            {imeiAlert?.is_blacklisted && (
                                <div className="mt-1 p-1.5 bg-red-50 border border-red-200 rounded flex items-start gap-1.5 text-red-800 text-xs">
                                    <AlertOctagon className="w-3 h-3 text-red-600 shrink-0 mt-0.5" />
                                    <span><strong>Blacklisted.</strong> {imeiAlert.reason || 'Reported stolen.'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </StepCard>

                {/* Connector → */}
                <Connector direction="right" active={step1Done} />

                {/* ── 2: Device ── */}
                <StepCard number={2} label="Device" done={step2Done} active={step1Done && !step2Done}>
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="field-label">Brand *</label>
                                <SelectBox value={selectedBrandId}
                                    onChange={v => { setSelectedBrandId(v); setForm(p => ({ ...p, brand: brands.find(x => x.id === v)?.name || '' })); setSelectedDeviceId('') }}
                                    options={brands.map(b => ({ value: b.id, label: b.name }))} placeholder="Brand…" />
                            </div>
                            <div>
                                <label className="field-label">Type *</label>
                                <SelectBox value={selectedTypeId}
                                    onChange={v => { setSelectedTypeId(v); setForm(p => ({ ...p, device_type: types.find(x => x.id === v)?.name || '' })); setSelectedDeviceId('') }}
                                    options={types.map(t => ({ value: t.id, label: t.name }))} placeholder="Type…" />
                            </div>
                        </div>
                        <div>
                            <label className="field-label">Model *</label>
                            <SelectBox value={selectedDeviceId} onChange={handleDeviceSelect}
                                options={uniqueModels.map(d => ({ value: d.id, label: d.model }))}
                                placeholder={!selectedBrandId && !selectedTypeId ? 'Select brand & type first…' : 'Select model…'}
                                disabled={uniqueModels.length === 0} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="field-label">Model No.</label>
                                <input value={form.model_number} onChange={e => setForm(p => ({ ...p, model_number: e.target.value }))} className="input h-8 text-xs" placeholder="A2848" />
                            </div>
                            <div>
                                <label className="field-label">Colour</label>
                                {colourOptions.length > 1
                                    ? <SelectBox value={form.colour} onChange={v => setForm(p => ({ ...p, colour: v }))} options={colourOptions.map(c => ({ value: c, label: c }))} placeholder="Colour…" />
                                    : <input value={form.colour} onChange={e => setForm(p => ({ ...p, colour: e.target.value }))} className="input h-8 text-xs" placeholder="Black" />}
                            </div>
                            <div>
                                <label className="field-label">Storage</label>
                                {storageOptions.length > 1
                                    ? <SelectBox value={form.storage} onChange={v => setForm(p => ({ ...p, storage: v }))} options={storageOptions.map(s => ({ value: s, label: s }))} placeholder="Storage…" />
                                    : <input value={form.storage} onChange={e => setForm(p => ({ ...p, storage: e.target.value }))} className="input h-8 text-xs" placeholder="128 GB" />}
                            </div>
                        </div>
                    </div>
                </StepCard>

                {/* Connector → */}
                <Connector direction="right" active={step2Done} />

                {/* ── 3: References ── */}
                <StepCard number={3} label="References" sublabel="optional" done={Boolean(form.customer_reference || form.batch_id)} active={step1Done && step2Done && !createdJob}>
                    <div className="space-y-2">
                        <div>
                            <label className="field-label">Customer Ref</label>
                            <input value={form.customer_reference} onChange={e => setForm(p => ({ ...p, customer_reference: e.target.value }))} className="input h-9 text-sm" placeholder="PO-1234" />
                        </div>
                        <div>
                            <label className="field-label">Batch ID</label>
                            <input value={form.batch_id} onChange={e => setForm(p => ({ ...p, batch_id: e.target.value }))} className="input h-9 text-sm" placeholder="BATCH-001" />
                        </div>
                        <div>
                            <label className="field-label">Condition Notes</label>
                            <input value={form.condition_notes} onChange={e => setForm(p => ({ ...p, condition_notes: e.target.value }))} className="input h-9 text-sm" placeholder="Minor scratch…" />
                        </div>
                    </div>
                </StepCard>

            </div>

            {/* Connector ↓ (from step 3 down, aligned to right) */}
            <div className="flex justify-end pr-0">
                <div className="w-[calc(33.333%-0px)] flex justify-center">
                    <Connector direction="down" active={step2Done} />
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────
          ROW 2: Step 4 (aligned under Step 3, on the right)
          ───────────────────────────────────────────────────────── */}
            <div className="flex justify-end">
                <div className="w-1/3">
                    <StepCard number={4} label="Close Order" done={step3Done} active={canSubmit} isLast>
                        {!createdJob ? (
                            <div className="space-y-2">
                                {/* Mini summary */}
                                {(step1Done || step2Done) && (
                                    <div className="text-xs space-y-0.5 text-text-secondary border border-border rounded p-2 bg-bg-secondary">
                                        {form.serial_number && <div className="flex justify-between"><span>Serial:</span><span className="font-mono font-semibold text-text-primary">{form.serial_number}</span></div>}
                                        {form.brand && <div className="flex justify-between"><span>Device:</span><span className="font-semibold text-text-primary">{form.brand} {form.model}</span></div>}
                                        {form.colour && <div className="flex justify-between"><span>Colour:</span><span className="font-semibold text-text-primary">{form.colour}</span></div>}
                                        {form.storage && <div className="flex justify-between"><span>Storage:</span><span className="font-semibold text-text-primary">{form.storage}</span></div>}
                                    </div>
                                )}
                                <button
                                    onClick={() => canSubmit && create.mutate()}
                                    disabled={!canSubmit || create.isPending}
                                    className="btn-primary w-full h-10 text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {create.isPending ? 'Creating…' : <><Check className="w-4 h-4" />Create &amp; Close Job</>}
                                </button>
                                {!canSubmit && <p className="text-xs text-text-secondary text-center">Complete steps 1 &amp; 2 first.</p>}
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-xs space-y-1">
                                    {(([
                                        ['Job', `#${createdJob.ticket_id}`],
                                        ['Serial', createdJob.serial_number],
                                        form.brand ? ['Device', `${form.brand} ${form.model}`] : null,
                                        form.colour ? ['Colour', form.colour] : null,
                                        form.storage ? ['Storage', form.storage] : null,
                                    ].filter(Boolean)) as string[][]).map(([k, v]) => (
                                        <div key={k} className="flex justify-between">
                                            <span className="text-green-700">{k}:</span>
                                            <span className="font-semibold font-mono text-green-900">{v}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <button onClick={() => setShowPrint(true)}
                                        className="btn-secondary h-8 text-xs flex items-center justify-center gap-1 text-brand-primary border-brand-primary hover:bg-brand-light">
                                        <PrinterIcon className="w-3 h-3" /> Print
                                    </button>
                                    <button onClick={() => navigate(`/job/${createdJob.id}/run`)}
                                        className="btn-primary h-8 text-xs flex items-center justify-center gap-1">
                                        <ArrowRight className="w-3 h-3" /> Start Work
                                    </button>
                                </div>
                                <button onClick={resetForm}
                                    className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 mx-auto">
                                    <Plus className="w-3 h-3" /> Register Another
                                </button>
                            </div>
                        )}
                    </StepCard>
                </div>
            </div>

            {createdJob && (
                <PrintLabelModal isOpen={showPrint} onClose={() => setShowPrint(false)}
                    context={{ id: createdJob.id, serial_number: createdJob.serial_number, imei: form.imei, brand: form.brand, device_type: form.device_type, model: form.model }} />
            )}
        </div>
    )
}

// ─── Step Card ─────────────────────────────────────────────────────────────

function StepCard({ number, label, sublabel, done, active, isLast, children }: {
    number: number; label: string; sublabel?: string
    done?: boolean; active?: boolean; isLast?: boolean; children: React.ReactNode
}) {
    return (
        <div className={`flex-1 rounded-xl border-2 p-3 transition-all duration-200 bg-bg-primary
      ${done && !isLast ? 'border-green-300 bg-green-50/20' : active ? 'border-brand-primary/50 shadow-md' : 'border-border opacity-70'}`}>
            {/* Step header */}
            <div className="flex items-center gap-2 mb-2.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
          ${done ? 'bg-green-500 text-white' : active ? 'bg-brand-primary text-white' : 'bg-bg-secondary text-text-secondary border border-border'}`}>
                    {done ? <Check className="w-3 h-3" /> : number}
                </div>
                <span className={`text-xs font-bold ${done ? 'text-green-700' : active ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {label}
                </span>
                {sublabel && <span className="text-xs text-text-secondary">({sublabel})</span>}
            </div>
            {children}
        </div>
    )
}

// ─── Connector ─────────────────────────────────────────────────────────────

function Connector({ direction, active }: { direction: 'right' | 'down'; active?: boolean }) {
    const color = active ? 'text-brand-primary' : 'text-border'
    if (direction === 'right') return (
        <div className="flex items-center px-1">
            <ChevronRight className={`w-5 h-5 ${color} transition-colors`} />
        </div>
    )
    return (
        <div className="flex justify-center h-5">
            <ChevronDown className={`w-5 h-5 ${color} transition-colors`} />
        </div>
    )
}

// ─── Select Box ────────────────────────────────────────────────────────────

function SelectBox({ value, onChange, options, placeholder, disabled = false }: {
    value: string; onChange: (v: string) => void
    options: { value: string; label: string }[]; placeholder: string; disabled?: boolean
}) {
    return (
        <div className="relative">
            <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
                className="input h-9 pr-6 appearance-none text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                <option value="">{placeholder}</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-text-secondary" />
        </div>
    )
}
